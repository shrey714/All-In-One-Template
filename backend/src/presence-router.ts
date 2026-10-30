import {
  Router,
  type Request,
  type RequestHandler,
  type Response,
} from "express"
import type { OrbitDatabase } from "./database.js"
import {
  requireToolAccess,
  createRequireAuth,
  type AuthenticatedRequest,
} from "./sessions.js"
import { toolAccessGrants } from "./permissions.js"

export const TOOL_PRESENCE_TTL_MS = 60_000
export const MAX_TOOL_PRESENCE_TABS_PER_USER = 20
const CLIENT_ID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const TOOL_ID = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/

type PresenceTarget = { domainId: string; toolId: string }

function readTarget(request: Request): PresenceTarget | undefined {
  const domainId = request.params.domainId
  const toolId = request.params.toolId
  if (
    typeof domainId !== "string" ||
    typeof toolId !== "string" ||
    domainId.length > 64 ||
    toolId.length > 64 ||
    !TOOL_ID.test(domainId) ||
    !TOOL_ID.test(toolId)
  ) {
    return undefined
  }
  return { domainId, toolId }
}

function fail(response: Response, status: number, error: string) {
  response.status(status).json({ error })
}

function withToolAccess(
  database: OrbitDatabase,
  inactivityTimeoutMinutes: number
): RequestHandler {
  const requireAuth = createRequireAuth(database, inactivityTimeoutMinutes)
  return (request, response, next) => {
    const target = readTarget(request)
    if (!target) {
      fail(response, 400, "Tool identifiers are invalid.")
      return
    }
    requireAuth(request, response, () => {
      if (!requireToolAccess(request, response, target.domainId, target.toolId))
        return
      response.locals.presenceTarget = target
      next()
    })
  }
}

export function createPresenceRouter(
  database: OrbitDatabase,
  inactivityTimeoutMinutes: number
) {
  const router = Router()
  const access = withToolAccess(database, inactivityTimeoutMinutes)
  const expireStale = database.prepare(
    "DELETE FROM tool_presence WHERE last_seen_at < ?"
  )
  const countUserTabs = database.prepare(
    `SELECT COUNT(*) AS count,
       EXISTS (SELECT 1 FROM tool_presence current
               WHERE current.user_id = ? AND current.client_id = ?) AS has_client
     FROM tool_presence WHERE user_id = ?`
  )
  const upsertLease = database.prepare(
    `INSERT INTO tool_presence (user_id, client_id, domain_id, tool_id, last_seen_at)
     VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(user_id, client_id) DO UPDATE SET
       domain_id = excluded.domain_id,
       tool_id = excluded.tool_id,
       last_seen_at = excluded.last_seen_at`
  )
  const recordHeartbeat = database.transaction(
    (userId: number, clientId: string, target: PresenceTarget, now: number) => {
      expireStale.run(now - TOOL_PRESENCE_TTL_MS)
      const leases = countUserTabs.get(userId, clientId, userId) as {
        count: number
        has_client: 0 | 1
      }
      if (
        leases.has_client === 0 &&
        leases.count >= MAX_TOOL_PRESENCE_TABS_PER_USER
      ) {
        return false
      }
      upsertLease.run(userId, clientId, target.domainId, target.toolId, now)
      return true
    }
  ).immediate
  const getActiveUsers = database.prepare(
    `SELECT DISTINCT u.id, u.display_name, u.must_change_password,
       EXISTS (
         SELECT 1 FROM user_roles ur
         JOIN role_grants rg ON rg.role_id = ur.role_id
         WHERE ur.user_id = u.id AND rg.grant_key IN ('*', 'dashboard:access')
       ) AS has_dashboard_access,
       EXISTS (
         SELECT 1 FROM user_roles ur
         JOIN role_grants rg ON rg.role_id = ur.role_id
         WHERE ur.user_id = u.id AND rg.grant_key IN ('*', ?, ?, ?)
       ) AS has_tool_access
     FROM tool_presence p
     JOIN users u ON u.id = p.user_id
     WHERE p.domain_id = ? AND p.tool_id = ? AND p.last_seen_at >= ? AND u.is_active = 1
     ORDER BY u.display_name COLLATE NOCASE, u.id`
  )
  const readSnapshot = (target: PresenceTarget, currentUserId: number) => {
    const now = Date.now()
    const rows = getActiveUsers.all(
      ...toolAccessGrants(target.domainId, target.toolId),
      target.domainId,
      target.toolId,
      now - TOOL_PRESENCE_TTL_MS
    ) as Array<{
      id: number
      display_name: string
      must_change_password: 0 | 1
      has_dashboard_access: 0 | 1
      has_tool_access: 0 | 1
    }>
    const users = rows
      .filter(
        (row) =>
          row.must_change_password === 0 &&
          row.has_dashboard_access === 1 &&
          row.has_tool_access === 1
      )
      .map((row) => ({
        displayName: row.display_name,
        isYou: row.id === currentUserId,
      }))
    return {
      users,
      count: users.length,
      refreshedAt: new Date(now).toISOString(),
    }
  }

  router.get("/:domainId/:toolId", access, (request, response) => {
    const target = response.locals.presenceTarget as PresenceTarget
    const currentUserId = (request as AuthenticatedRequest).orbitUser!.id
    expireStale.run(Date.now() - TOOL_PRESENCE_TTL_MS)
    response.json(readSnapshot(target, currentUserId))
  })

  router.post("/:domainId/:toolId/heartbeat", access, (request, response) => {
    const target = response.locals.presenceTarget as PresenceTarget
    const userId = (request as AuthenticatedRequest).orbitUser!.id
    const clientId =
      typeof request.body?.clientId === "string" ? request.body.clientId : ""
    if (!CLIENT_ID.test(clientId)) {
      fail(response, 400, "Presence client identifier is invalid.")
      return
    }
    const now = Date.now()
    const recorded = recordHeartbeat(userId, clientId, target, now)
    if (!recorded) {
      response.status(429).json({
        error: `This account has reached the ${MAX_TOOL_PRESENCE_TABS_PER_USER}-tab presence limit.`,
        code: "PRESENCE_TAB_LIMIT",
      })
      return
    }
    response.json(readSnapshot(target, userId))
  })

  router.delete("/:domainId/:toolId/heartbeat", access, (request, response) => {
    const target = response.locals.presenceTarget as PresenceTarget
    const userId = (request as AuthenticatedRequest).orbitUser!.id
    const clientId =
      typeof request.body?.clientId === "string" ? request.body.clientId : ""
    if (!CLIENT_ID.test(clientId)) {
      fail(response, 400, "Presence client identifier is invalid.")
      return
    }
    database
      .prepare(
        `DELETE FROM tool_presence
         WHERE user_id = ? AND client_id = ? AND domain_id = ? AND tool_id = ?`
      )
      .run(userId, clientId, target.domainId, target.toolId)
    response.status(204).end()
  })
  return router
}
