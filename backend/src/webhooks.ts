import { createHmac, randomUUID } from "node:crypto"
import { isIP } from "node:net"
import type { Request } from "express"
import type { OrbitDatabase } from "./database.js"

const MAX_SUBSCRIPTIONS = 50
const MAX_EVENT_BYTES = 24 * 1024
const MAX_ATTEMPTS = 6
const REQUEST_TIMEOUT_MS = 5_000
const DELIVERY_LEASE_MS = 15_000
const RETENTION_MS = 30 * 24 * 60 * 60 * 1000
const SUBSCRIPTION_ID = /^[a-z][a-z0-9-]{1,63}$/
const EVENT_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/
const EVENT_TYPE = /^[a-z][a-z0-9]*(?:[.:_-][a-z0-9]+)*$/
const SECRET_ENV = /^ORBIT_WEBHOOK_SECRET_[A-Z0-9_]{1,56}$/
const TOOL_ID = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/

export type WebhookSubscription = {
  id: string
  url: string
  secretEnv: string
  signingSecret: string
  events: string[]
}

export type OrbitWebhookEvent = {
  type: string
  idempotencyKey?: string
  domainId?: string
  toolId?: string
  data: Record<string, unknown>
}

type DeliveryRow = {
  id: string
  endpoint_id: string
  event_type: string
  url: string
  secret_env: string
  payload_json: string
  attempts: number
}

export function loadWebhookSubscriptions(
  serialized = process.env.ORBIT_WEBHOOK_SUBSCRIPTIONS,
  environment: NodeJS.ProcessEnv = process.env
): WebhookSubscription[] {
  if (!serialized?.trim()) return []
  let parsed: unknown
  try {
    parsed = JSON.parse(serialized)
  } catch {
    throw new Error("ORBIT_WEBHOOK_SUBSCRIPTIONS must contain valid JSON.")
  }
  if (!Array.isArray(parsed) || parsed.length > MAX_SUBSCRIPTIONS) {
    throw new Error(
      `ORBIT_WEBHOOK_SUBSCRIPTIONS must be an array with at most ${MAX_SUBSCRIPTIONS} subscriptions.`
    )
  }
  const ids = new Set<string>()
  return parsed.map((candidate, index) => {
    if (
      !isRecord(candidate) ||
      !hasExactKeys(candidate, ["id", "url", "secretEnv", "events"])
    ) {
      throw new Error(`Webhook subscription ${index + 1} has an invalid shape.`)
    }
    const { id, url, secretEnv, events } = candidate
    if (typeof id !== "string" || !SUBSCRIPTION_ID.test(id) || ids.has(id)) {
      throw new Error(
        `Webhook subscription ${index + 1} has an invalid or duplicate id.`
      )
    }
    ids.add(id)
    if (typeof url !== "string" || url.length > 2048) {
      throw new Error(`Webhook subscription ${id} has an invalid URL.`)
    }
    let parsedUrl: URL
    try {
      parsedUrl = new URL(url)
    } catch {
      throw new Error(`Webhook subscription ${id} has an invalid URL.`)
    }
    if (
      parsedUrl.protocol !== "https:" ||
      parsedUrl.username ||
      parsedUrl.password ||
      parsedUrl.search ||
      parsedUrl.hash ||
      isIP(parsedUrl.hostname.replace(/^\[|\]$/g, "")) !== 0 ||
      parsedUrl.hostname.toLowerCase() === "localhost" ||
      parsedUrl.hostname.toLowerCase().endsWith(".localhost") ||
      parsedUrl.hostname.toLowerCase().endsWith(".local")
    ) {
      throw new Error(
        `Webhook subscription ${id} must use a public HTTPS hostname without credentials, query strings, or fragments.`
      )
    }
    if (typeof secretEnv !== "string" || !SECRET_ENV.test(secretEnv)) {
      throw new Error(
        `Webhook subscription ${id} must reference a named secret environment variable.`
      )
    }
    const signingSecret = environment[secretEnv]
    if (typeof signingSecret !== "string" || signingSecret.length < 32) {
      throw new Error(`${secretEnv} must contain at least 32 characters.`)
    }
    if (
      !Array.isArray(events) ||
      events.length < 1 ||
      events.length > 100 ||
      !events.every(
        (event) =>
          event === "*" || (typeof event === "string" && EVENT_TYPE.test(event))
      ) ||
      new Set(events).size !== events.length
    ) {
      throw new Error(`Webhook subscription ${id} has an invalid event filter.`)
    }
    return {
      id,
      url: parsedUrl.href,
      secretEnv,
      signingSecret,
      events: [...events],
    }
  })
}

export function createWebhookOutbox(
  database: OrbitDatabase,
  enabled: boolean,
  subscriptions: readonly WebhookSubscription[],
  fetchImpl: typeof fetch = fetch
) {
  function publish(event: OrbitWebhookEvent) {
    if (!enabled || subscriptions.length === 0) return 0
    const envelope = normalizeEvent(event)
    if (!envelope) throw new Error("Webhook event is invalid or too large.")
    const serialized = JSON.stringify(envelope)
    const id = envelope.id
    const now = Date.now()
    database
      .prepare("DELETE FROM webhook_deliveries WHERE created_at < ?")
      .run(now - RETENTION_MS)
    const insert = database.prepare(
      `INSERT OR IGNORE INTO webhook_deliveries
       (id, endpoint_id, event_type, url, secret_env, payload_json, status, attempts, next_attempt_at, lease_until, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, 'pending', 0, ?, NULL, ?, ?)`
    )
    const enqueue = database.transaction(() => {
      let count = 0
      for (const subscription of subscriptions) {
        if (
          !subscription.events.includes("*") &&
          !subscription.events.includes(event.type)
        )
          continue
        count += insert.run(
          `${id}:${subscription.id}`,
          subscription.id,
          event.type,
          subscription.url,
          subscription.secretEnv,
          serialized,
          now,
          now,
          now
        ).changes
      }
      return count
    })
    return enqueue()
  }

  let draining = false
  async function deliverDueBatch(now = Date.now(), limit = 20) {
    if (!enabled || subscriptions.length === 0 || draining) return 0
    draining = true
    try {
      database
        .prepare("DELETE FROM webhook_deliveries WHERE created_at < ?")
        .run(now - RETENTION_MS)
      const rows = database
        .prepare(
          `SELECT id, endpoint_id, event_type, url, secret_env, payload_json, attempts
           FROM webhook_deliveries
           WHERE (status = 'pending' AND next_attempt_at <= ?)
              OR (status = 'sending' AND lease_until <= ?)
           ORDER BY created_at ASC LIMIT ?`
        )
        .all(now, now, Math.max(1, Math.min(limit, 100))) as DeliveryRow[]
      let delivered = 0
      for (const row of rows) {
        const claimTime = Math.max(now, Date.now())
        const claim = database
          .prepare(
            `UPDATE webhook_deliveries
             SET status = 'sending', lease_until = ?, updated_at = ?
             WHERE id = ? AND ((status = 'pending' AND next_attempt_at <= ?)
                OR (status = 'sending' AND lease_until <= ?))`
          )
          .run(
            claimTime + DELIVERY_LEASE_MS,
            claimTime,
            row.id,
            claimTime,
            claimTime
          )
        if (claim.changes === 0) continue
        const attempt = row.attempts + 1
        const subscription = subscriptions.find(
          (candidate) => candidate.id === row.endpoint_id
        )
        if (
          !subscription ||
          subscription.url !== row.url ||
          subscription.secretEnv !== row.secret_env
        ) {
          database
            .prepare(
              `UPDATE webhook_deliveries SET status = 'failed', attempts = ?,
                 lease_until = NULL, last_error = 'Webhook endpoint configuration changed.', updated_at = ?
               WHERE id = ?`
            )
            .run(attempt, claimTime, row.id)
          continue
        }
        let responseStatus: number | null = null
        let failure: string | null = null
        try {
          const timestamp = String(Math.floor(claimTime / 1000))
          const signature = createHmac("sha256", subscription.signingSecret)
            .update(`${timestamp}.${row.payload_json}`)
            .digest("hex")
          const response = await fetchImpl(row.url, {
            method: "POST",
            redirect: "error",
            signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
            headers: {
              "Content-Type": "application/json",
              "X-Orbit-Event": row.event_type,
              "X-Orbit-Delivery": row.id,
              "X-Orbit-Timestamp": timestamp,
              "X-Orbit-Signature": `sha256=${signature}`,
              "Idempotency-Key": row.id,
            },
            body: row.payload_json,
          })
          responseStatus = response.status
          if (!response.ok) failure = `HTTP ${response.status}`
          if (response.body) await response.body.cancel().catch(() => undefined)
        } catch {
          failure = "Network request failed or timed out."
        }
        if (!failure) {
          const completedAt = Math.max(claimTime, Date.now())
          database
            .prepare(
              `UPDATE webhook_deliveries
               SET status = 'delivered', attempts = ?, lease_until = NULL,
                   last_http_status = ?, last_error = NULL, delivered_at = ?, updated_at = ?
               WHERE id = ?`
            )
            .run(attempt, responseStatus, completedAt, completedAt, row.id)
          delivered += 1
          continue
        }
        const permanentClientError =
          responseStatus !== null &&
          responseStatus >= 400 &&
          responseStatus < 500 &&
          responseStatus !== 408 &&
          responseStatus !== 429
        const exhausted = attempt >= MAX_ATTEMPTS
        const status = permanentClientError || exhausted ? "failed" : "pending"
        const delay = Math.min(15 * 60_000, 1_000 * 2 ** (attempt - 1))
        const completedAt = Math.max(claimTime, Date.now())
        database
          .prepare(
            `UPDATE webhook_deliveries
             SET status = ?, attempts = ?, next_attempt_at = ?, lease_until = NULL,
                 last_http_status = ?, last_error = ?, updated_at = ?
             WHERE id = ?`
          )
          .run(
            status,
            attempt,
            completedAt + delay,
            responseStatus,
            failure.slice(0, 240),
            completedAt,
            row.id
          )
      }
      return delivered
    } finally {
      draining = false
    }
  }

  return { publish, deliverDueBatch }
}

export function startWebhookWorker(
  outbox: ReturnType<typeof createWebhookOutbox>,
  intervalMs = 2_000
) {
  let stopped = false
  let currentRun: Promise<unknown> | null = null
  const tick = () => {
    if (stopped || currentRun) return
    currentRun = outbox
      .deliverDueBatch()
      .catch((error: unknown) => {
        console.error("Webhook delivery batch failed.", error)
      })
      .finally(() => {
        currentRun = null
      })
  }
  const timer = setInterval(tick, intervalMs)
  timer.unref()
  tick()
  return async () => {
    stopped = true
    clearInterval(timer)
    await currentRun
  }
}

export function publishWebhookEvent(
  request: Request,
  event: OrbitWebhookEvent
) {
  const outbox = request.app.locals.orbitWebhooks as
    ReturnType<typeof createWebhookOutbox> | undefined
  return outbox?.publish(event) ?? 0
}

function normalizeEvent(event: OrbitWebhookEvent) {
  if (
    !isRecord(event) ||
    typeof event.type !== "string" ||
    !EVENT_TYPE.test(event.type) ||
    (event.idempotencyKey !== undefined &&
      (typeof event.idempotencyKey !== "string" ||
        !EVENT_ID.test(event.idempotencyKey))) ||
    !isRecord(event.data) ||
    (event.domainId !== undefined &&
      (typeof event.domainId !== "string" || !TOOL_ID.test(event.domainId))) ||
    (event.toolId !== undefined &&
      (typeof event.toolId !== "string" || !TOOL_ID.test(event.toolId)))
  ) {
    return null
  }
  const envelope = {
    id: event.idempotencyKey ?? randomUUID(),
    type: event.type,
    occurredAt: new Date().toISOString(),
    ...(event.domainId ? { domainId: event.domainId } : {}),
    ...(event.toolId ? { toolId: event.toolId } : {}),
    data: event.data,
  }
  try {
    const serialized = JSON.stringify(envelope)
    if (Buffer.byteLength(serialized, "utf8") > MAX_EVENT_BYTES) return null
    return JSON.parse(serialized) as typeof envelope
  } catch {
    return null
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false
  }
  try {
    const prototype = Object.getPrototypeOf(value)
    return prototype === Object.prototype || prototype === null
  } catch {
    return false
  }
}

function hasExactKeys(value: Record<string, unknown>, keys: readonly string[]) {
  const actual = Object.keys(value)
  return (
    actual.length === keys.length &&
    keys.every((key) => Object.hasOwn(value, key))
  )
}
