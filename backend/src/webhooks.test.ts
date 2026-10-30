import assert from "node:assert/strict"
import { createHmac } from "node:crypto"
import test from "node:test"
import { openDatabase } from "./database.js"
import { createWebhookOutbox, loadWebhookSubscriptions } from "./webhooks.js"

const SECRET = "webhook-test-secret-that-is-at-least-thirty-two-characters"
const subscriptionJson = JSON.stringify([
  {
    id: "finance-events",
    url: "https://hooks.example.com/orbit/events",
    secretEnv: "ORBIT_WEBHOOK_SECRET_FINANCE",
    events: ["finance.report.ready"],
  },
])

function subscriptions() {
  return loadWebhookSubscriptions(subscriptionJson, {
    ORBIT_WEBHOOK_SECRET_FINANCE: SECRET,
  })
}

test("webhook subscription parser rejects unsafe URLs and weak secrets", () => {
  assert.throws(
    () =>
      loadWebhookSubscriptions(
        JSON.stringify([
          {
            id: "local-target",
            url: "http://localhost:3000/hook",
            secretEnv: "ORBIT_WEBHOOK_SECRET_FINANCE",
            events: ["*"],
          },
        ]),
        { ORBIT_WEBHOOK_SECRET_FINANCE: SECRET }
      ),
    /public HTTPS hostname/
  )
  assert.throws(
    () =>
      loadWebhookSubscriptions(
        JSON.stringify([
          {
            id: "query-token",
            url: "https://hooks.example.com/hook?token=secret",
            secretEnv: "ORBIT_WEBHOOK_SECRET_FINANCE",
            events: ["*"],
          },
        ]),
        { ORBIT_WEBHOOK_SECRET_FINANCE: SECRET }
      ),
    /public HTTPS hostname/
  )
  assert.throws(
    () =>
      loadWebhookSubscriptions(subscriptionJson, {
        ORBIT_WEBHOOK_SECRET_FINANCE: "short",
      }),
    /at least 32 characters/
  )
})

test("outbound webhook delivery is filtered, signed, retryable, and idempotent", async () => {
  const database = openDatabase(":memory:")
  const calls: Array<{ url: string | URL | Request; init?: RequestInit }> = []
  let fetchCount = 0
  const fetchMock = (async (
    url: string | URL | Request,
    init?: RequestInit
  ) => {
    calls.push({ url, init })
    fetchCount += 1
    return new Response(null, { status: fetchCount === 1 ? 503 : 204 })
  }) as typeof fetch
  try {
    const outbox = createWebhookOutbox(
      database,
      true,
      subscriptions(),
      fetchMock
    )
    const event = {
      type: "finance.report.ready",
      idempotencyKey: "report:r-123:ready:v1",
      domainId: "finance",
      toolId: "report-center",
      data: { reportId: "r-123", rowCount: 42 },
    }
    assert.equal(outbox.publish(event), 1)
    assert.equal(outbox.publish(event), 0)
    assert.equal(
      outbox.publish({ ...event, type: "finance.report.ignored" }),
      0
    )
    const firstDeliveryTime = Date.now()
    assert.equal(await outbox.deliverDueBatch(firstDeliveryTime), 0)

    const retry = database
      .prepare(
        "SELECT id, status, attempts, next_attempt_at, last_http_status, payload_json, secret_env FROM webhook_deliveries"
      )
      .get() as {
      id: string
      status: string
      attempts: number
      next_attempt_at: number
      last_http_status: number | null
      payload_json: string
      secret_env: string
    }
    assert.equal(retry.status, "pending")
    assert.equal(retry.attempts, 1)
    assert.equal(retry.last_http_status, 503)
    assert.equal(retry.secret_env, "ORBIT_WEBHOOK_SECRET_FINANCE")
    assert.ok(retry.next_attempt_at >= firstDeliveryTime + 1_000)
    assert.equal(retry.payload_json.includes(SECRET), false)
    assert.equal(retry.id, "report:r-123:ready:v1:finance-events")
    const schema = database.pragma("table_info(webhook_deliveries)") as Array<{
      name: string
    }>
    assert.ok(schema.some((column) => column.name === "secret_env"))
    assert.ok(!schema.some((column) => column.name === "signing_secret"))

    const firstInit = calls[0]?.init
    assert.equal(firstInit?.method, "POST")
    const firstHeaders = new Headers(firstInit?.headers)
    assert.equal(firstHeaders.get("X-Orbit-Event"), "finance.report.ready")
    assert.equal(firstHeaders.get("X-Orbit-Delivery"), retry.id)
    assert.equal(firstHeaders.get("Idempotency-Key"), retry.id)
    const timestamp = firstHeaders.get("X-Orbit-Timestamp")
    const signature = firstHeaders.get("X-Orbit-Signature")
    assert.ok(timestamp)
    assert.equal(
      signature,
      `sha256=${createHmac("sha256", SECRET)
        .update(`${timestamp}.${retry.payload_json}`)
        .digest("hex")}`
    )
    assert.equal(
      (JSON.parse(retry.payload_json) as { id: string }).id,
      event.idempotencyKey
    )

    assert.equal(await outbox.deliverDueBatch(retry.next_attempt_at), 1)
    const delivered = database
      .prepare(
        "SELECT status, attempts, last_http_status FROM webhook_deliveries"
      )
      .get() as { status: string; attempts: number; last_http_status: number }
    assert.deepEqual(delivered, {
      status: "delivered",
      attempts: 2,
      last_http_status: 204,
    })
  } finally {
    database.close()
  }
})

test("disabled webhook outbox does not queue or deliver events", async () => {
  const database = openDatabase(":memory:")
  try {
    const outbox = createWebhookOutbox(database, false, subscriptions())
    assert.equal(
      outbox.publish({ type: "finance.report.ready", data: { reportId: "x" } }),
      0
    )
    assert.equal(await outbox.deliverDueBatch(), 0)
    const row = database
      .prepare("SELECT COUNT(*) AS count FROM webhook_deliveries")
      .get() as { count: number }
    assert.equal(row.count, 0)
  } finally {
    database.close()
  }
})

test("webhook enqueue rolls back with the tool's SQLite transaction", () => {
  const database = openDatabase(":memory:")
  try {
    database.exec("CREATE TABLE test_reports (id TEXT PRIMARY KEY)")
    const outbox = createWebhookOutbox(database, true, subscriptions())
    const transaction = database.transaction(() => {
      database.prepare("INSERT INTO test_reports (id) VALUES (?)").run("r-123")
      outbox.publish({
        type: "finance.report.ready",
        idempotencyKey: "report:r-123:ready:v1",
        data: { reportId: "r-123" },
      })
      throw new Error("simulate business transaction failure")
    })
    assert.throws(transaction, /simulate business transaction failure/)
    const reports = database
      .prepare("SELECT COUNT(*) AS count FROM test_reports")
      .get() as { count: number }
    const deliveries = database
      .prepare("SELECT COUNT(*) AS count FROM webhook_deliveries")
      .get() as { count: number }
    assert.equal(reports.count, 0)
    assert.equal(deliveries.count, 0)
  } finally {
    database.close()
  }
})

test("webhook events reject invalid identifiers and oversized data", () => {
  const database = openDatabase(":memory:")
  try {
    const outbox = createWebhookOutbox(database, true, subscriptions())
    assert.throws(
      () => outbox.publish({ type: "not a valid event", data: {} }),
      /invalid or too large/
    )
    assert.throws(
      () =>
        outbox.publish({
          type: "finance.report.ready",
          idempotencyKey: "contains spaces",
          data: {},
        }),
      /invalid or too large/
    )
    assert.throws(
      () =>
        outbox.publish({
          type: "finance.report.ready",
          data: { note: "x".repeat(25_000) },
        }),
      /invalid or too large/
    )
  } finally {
    database.close()
  }
})
