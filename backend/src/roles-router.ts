import { randomUUID } from "node:crypto"
import { Router, type Request, type Response } from "express"
import {
  assignRoles,
  getUserById,
  getUserPermissions,
  isSystemAdmin,
  listRoles,
  type OrbitDatabase,
  writeAuthorizationAudit,
} from "./database.js"
import { isValidGrant } from "./permissions.js"
import {
  createRequireAuth,
  type AuthenticatedRequest,
  requirePermission,
} from "./sessions.js"

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function fail(response: Response, status: number, error: string) {
  response.status(status).json({ error })
}

function roleId(request: Request) {
  return typeof request.params.roleId === "string"
    ? request.params.roleId
    : undefined
}

function targetUserId(request: Request) {
  const value = request.params.userId
  if (typeof value !== "string" || !/^\d+$/.test(value)) return undefined
  const id = Number(value)
  return Number.isSafeInteger(id) && id > 0 ? id : undefined
}

function readRoleInput(body: unknown) {
  if (!isRecord(body)) return undefined
  const name = typeof body.name === "string" ? body.name.trim() : ""
  const description =
    typeof body.description === "string" ? body.description.trim() : ""
  const grants = body.grants
  if (name.length < 2 || name.length > 60 || description.length > 240)
    return undefined
  if (
    !Array.isArray(grants) ||
    grants.length > 200 ||
    !grants.every(isValidGrant)
  )
    return undefined
  if (new Set(grants).size !== grants.length) return undefined
  return { name, description, grants: grants as string[] }
}

function mayDefineGrants(
  database: OrbitDatabase,
  actorId: number,
  grants: readonly string[]
) {
  const actorGrants = getUserPermissions(database, actorId)
  return (
    actorGrants.includes("*") ||
    grants.every((grant) => actorGrants.includes(grant))
  )
}

export function createRolesRouter(
  database: OrbitDatabase,
  inactivityTimeoutMinutes: number
) {
  const router = Router()
  const requireAuth = createRequireAuth(database, inactivityTimeoutMinutes)

  router.get("/roles", requireAuth, (request, response) => {
    if (!requirePermission(request, response, "roles:read")) return
    response.json({ roles: listRoles(database) })
  })

  router.post("/roles", requireAuth, (request, response) => {
    if (!requirePermission(request, response, "roles:manage")) return
    const input = readRoleInput(request.body)
    if (!input)
      return fail(
        response,
        400,
        "Role name, description, or grants are invalid."
      )
    const actor = (request as AuthenticatedRequest).orbitUser!
    if (!mayDefineGrants(database, actor.id, input.grants))
      return fail(
        response,
        403,
        "You may only define roles with permissions you already hold."
      )
    const id = randomUUID()
    const now = new Date().toISOString()
    try {
      database.transaction(() => {
        database
          .prepare(
            "INSERT INTO roles (id, name, description, is_builtin, is_assignable, created_at, updated_at) VALUES (?, ?, ?, 0, 1, ?, ?)"
          )
          .run(id, input.name, input.description, now, now)
        const insertGrant = database.prepare(
          "INSERT INTO role_grants (role_id, grant_key) VALUES (?, ?)"
        )
        for (const grant of input.grants) insertGrant.run(id, grant)
        writeAuthorizationAudit(
          database,
          actor.id,
          "role.created",
          "role",
          id,
          {
            name: input.name,
            grants: input.grants,
          }
        )
      })()
    } catch (error) {
      if (error instanceof Error && error.message.includes("UNIQUE"))
        return fail(response, 409, "A role with that name already exists.")
      throw error
    }
    response
      .status(201)
      .json({ role: listRoles(database).find((role) => role.id === id) })
  })

  router.patch("/roles/:roleId", requireAuth, (request, response) => {
    if (!requirePermission(request, response, "roles:manage")) return
    const id = roleId(request)
    const input = readRoleInput(request.body)
    if (!id || !input) return fail(response, 400, "Role update is invalid.")
    const role = listRoles(database).find((item) => item.id === id)
    if (!role) return fail(response, 404, "Role not found.")
    if (role.isBuiltIn)
      return fail(response, 403, "Built-in roles cannot be edited.")
    const actor = (request as AuthenticatedRequest).orbitUser!
    if (!mayDefineGrants(database, actor.id, input.grants))
      return fail(
        response,
        403,
        "You may only define roles with permissions you already hold."
      )
    try {
      database.transaction(() => {
        database
          .prepare(
            "UPDATE roles SET name = ?, description = ?, updated_at = ? WHERE id = ?"
          )
          .run(input.name, input.description, new Date().toISOString(), id)
        database.prepare("DELETE FROM role_grants WHERE role_id = ?").run(id)
        const insertGrant = database.prepare(
          "INSERT INTO role_grants (role_id, grant_key) VALUES (?, ?)"
        )
        for (const grant of input.grants) insertGrant.run(id, grant)
        writeAuthorizationAudit(
          database,
          actor.id,
          "role.updated",
          "role",
          id,
          {
            name: input.name,
            grants: input.grants,
          }
        )
      })()
    } catch (error) {
      if (error instanceof Error && error.message.includes("UNIQUE"))
        return fail(response, 409, "A role with that name already exists.")
      throw error
    }
    response.json({ role: listRoles(database).find((item) => item.id === id) })
  })

  router.delete("/roles/:roleId", requireAuth, (request, response) => {
    if (!requirePermission(request, response, "roles:manage")) return
    const id = roleId(request)
    if (!id) return fail(response, 400, "Role id is invalid.")
    const role = listRoles(database).find((item) => item.id === id)
    if (!role) return fail(response, 404, "Role not found.")
    if (role.isBuiltIn)
      return fail(response, 403, "Built-in roles cannot be deleted.")
    const assignments = database
      .prepare("SELECT COUNT(*) AS count FROM user_roles WHERE role_id = ?")
      .get(id) as { count: number }
    if (assignments.count)
      return fail(
        response,
        409,
        "Unassign this role from every user before deleting it."
      )
    const actor = (request as AuthenticatedRequest).orbitUser!
    database.prepare("DELETE FROM roles WHERE id = ?").run(id)
    writeAuthorizationAudit(database, actor.id, "role.deleted", "role", id, {
      name: role.name,
    })
    response.status(204).end()
  })

  router.patch("/users/:userId/roles", requireAuth, (request, response) => {
    if (!requirePermission(request, response, "users:assign-roles")) return
    const userId = targetUserId(request)
    if (
      !userId ||
      !isRecord(request.body) ||
      !Array.isArray(request.body.roleIds) ||
      !request.body.roleIds.every((id) => typeof id === "string")
    )
      return fail(response, 400, "Role assignments must be a list of role ids.")
    const user = getUserById(database, userId)
    if (!user) return fail(response, 404, "User not found.")
    if (isSystemAdmin(database, userId))
      return fail(
        response,
        409,
        "The protected System administrator's roles cannot be changed."
      )
    const actor = (request as AuthenticatedRequest).orbitUser!
    try {
      assignRoles(database, userId, request.body.roleIds, actor.id)
    } catch (error) {
      return fail(
        response,
        400,
        error instanceof Error ? error.message : "Invalid role assignment."
      )
    }
    writeAuthorizationAudit(
      database,
      actor.id,
      "user.roles-assigned",
      "user",
      String(userId),
      {
        roleIds: request.body.roleIds,
      }
    )
    response.json({
      roles: listRoles(database).filter((role) =>
        request.body.roleIds.includes(role.id)
      ),
    })
  })

  return router
}
