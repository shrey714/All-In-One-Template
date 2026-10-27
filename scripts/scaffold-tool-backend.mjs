export function createApiRouterSource({
  domainId,
  id,
  componentName,
  actions,
}) {
  const guardImports = actions.length
    ? "createRequireAuth, requireFeaturePermission"
    : "createRequireAuth, requireToolAccess"
  const routes = actions.length
    ? actions
        .map(
          (
            action
          ) => `  router.post("/actions/${action}", (request, response) => {
    if (!requireFeaturePermission(request, response, ${JSON.stringify(domainId)}, ${JSON.stringify(id)}, ${JSON.stringify(id)}, ${JSON.stringify(action)})) return
    // TODO: implement this operation only after the authorization check succeeds.
    response.status(501).json({ error: "Action not implemented." })
  })`
        )
        .join("\n\n")
    : `  router.post("/run", (request, response) => {
    if (!requireToolAccess(request, response, ${JSON.stringify(domainId)}, ${JSON.stringify(id)})) return
    // TODO: implement this operation only after the authorization check succeeds.
    response.status(501).json({ error: "Operation not implemented." })
  })`

  return `import { Router } from "express"
import type { OrbitDatabase } from "../../../database.js"
import { ${guardImports} } from "../../../sessions.js"

export function create${componentName}Api(database: OrbitDatabase, inactivityTimeoutMinutes: number) {
  const router = Router()
  router.use(createRequireAuth(database, inactivityTimeoutMinutes))

${routes}

  return router
}
`
}

export function createApiTestSource({ domainId, id, componentName, actions }) {
  const grants = [
    "dashboard:access",
    `tool:${domainId}/${id}:access`,
    ...actions.map((action) => `feature:${domainId}/${id}/${id}:${action}`),
  ]
  const paths = actions.length
    ? actions.map((action) => `/actions/${action}`)
    : ["/run"]

  return `import assert from "node:assert/strict"
import { createServer } from "node:http"
import test from "node:test"
import express from "express"
import { openDatabase } from "./database.js"
import { hashSessionToken } from "./sessions.js"
import { create${componentName}Api } from "./tools/${domainId}/${id}/router.js"

const authorizedGrants = ${JSON.stringify(grants)}
const testPaths = ${JSON.stringify(paths)}

test(${JSON.stringify(`${domainId}/${id} API enforces authorization at the HTTP boundary`)}, async () => {
  const database = openDatabase(":memory:")
  const createdAt = new Date().toISOString()
  const insertUser = database.prepare("INSERT INTO users (username, display_name, password_hash, role, is_active, must_change_password, created_at, updated_at) VALUES (?, ?, 'test-only-hash', 'member', 1, 0, ?, ?)")
  const allowedUserId = Number(insertUser.run("allowed.test", "Allowed test user", createdAt, createdAt).lastInsertRowid)
  const deniedUserId = Number(insertUser.run("denied.test", "Denied test user", createdAt, createdAt).lastInsertRowid)
  const roleId = ${JSON.stringify(`test-${domainId}-${id}`)}
  database.prepare("INSERT INTO roles (id, name, description, is_builtin, is_assignable, created_at, updated_at) VALUES (?, ?, '', 0, 1, ?, ?)").run(roleId, roleId, createdAt, createdAt)
  const insertGrant = database.prepare("INSERT INTO role_grants (role_id, grant_key) VALUES (?, ?)")
  for (const grant of authorizedGrants) insertGrant.run(roleId, grant)
  database.prepare("INSERT INTO user_roles (user_id, role_id, assigned_at) VALUES (?, ?, ?)").run(allowedUserId, roleId, createdAt)

  const allowedToken = "a".repeat(64)
  const deniedToken = "b".repeat(64)
  const sessions: Array<{ token: string; userId: number }> = [
    { token: allowedToken, userId: allowedUserId },
    { token: deniedToken, userId: deniedUserId },
  ]
  const insertSession = database.prepare("INSERT INTO sessions (token_hash, user_id, created_at, expires_at, last_seen_at) VALUES (?, ?, ?, ?, ?)")
  for (const { token, userId } of sessions) {
    const now = Date.now()
    insertSession.run(hashSessionToken(token), userId, now, now + 60_000, now)
  }

  const app = express()
  app.use("/api/tools/${domainId}/${id}", create${componentName}Api(database, 10))
  const server = createServer(app)
  try {
    await new Promise<void>((resolve, reject) => {
      server.once("error", reject)
      server.listen(0, "127.0.0.1", () => resolve())
    })
    const address = server.address()
    if (!address || typeof address === "string") {
      throw new Error("Expected the test server to bind to a TCP port.")
    }
    const port: number = address.port
    for (const path of testPaths) {
      const endpoint: string = "http://127.0.0.1:" + port + "/api/tools/${domainId}/${id}" + path
      const allowed = await fetch(endpoint, { method: "POST", headers: { Cookie: "orbit_session=" + allowedToken } })
      assert.equal(allowed.status, 501, "authorized " + path + " passes guards and reaches the unimplemented operation")
      const denied = await fetch(endpoint, { method: "POST", headers: { Cookie: "orbit_session=" + deniedToken } })
      assert.equal(denied.status, 403, "authenticated user without grants is denied " + path)
      const anonymous = await fetch(endpoint, { method: "POST" })
      assert.equal(anonymous.status, 401, "anonymous user is denied " + path)
    }
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()))
    database.close()
  }
})
`
}
