import express, {
  type Request,
  type RequestHandler,
  type Response,
} from "express"
import rateLimit from "express-rate-limit"
import helmet from "helmet"
import { loadOrbitConfig, type OrbitRuntimeConfig } from "./config.js"
import {
  activeAdminCount,
  getUserById,
  getUserByUsername,
  type OrbitDatabase,
  type UserRecord,
  toPublicUser,
} from "./database.js"
import {
  hashPassword,
  isValidPasswordLength,
  verifyPassword,
} from "./password.js"
import {
  clearSessionCookie,
  createRequireAuth,
  currentSessionToken,
  deleteSession,
  deleteUserSessions,
  issueSession,
  type AuthenticatedRequest,
  requireAdmin,
} from "./sessions.js"

const dummyPasswordHashPromise = hashPassword("orbit-invalid-login-dummy-value")
const unsafeMethods = new Set(["POST", "PUT", "PATCH", "DELETE"])
const validUsername = /^[A-Za-z0-9._-]{3,40}$/
const loginRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: { error: "Too many sign-in attempts. Wait a while and try again." },
})

function originIsTrusted(request: Request) {
  const origin = request.get("origin")
  if (!origin) return false
  let parsed: URL
  try {
    parsed = new URL(origin)
  } catch {
    return false
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return false
  const configured = process.env.ORBIT_WEB_ORIGIN
  if (configured) return parsed.origin === new URL(configured).origin
  if (process.env.NODE_ENV !== "production") {
    return ["localhost", "127.0.0.1", "::1", "[::1]"].includes(parsed.hostname)
  }
  return parsed.origin === `${request.protocol}://${request.get("host")}`
}

const requireSameOrigin: RequestHandler = (request, response, next) => {
  if (unsafeMethods.has(request.method) && !originIsTrusted(request)) {
    response.status(403).json({ error: "This request origin is not allowed." })
    return
  }
  next()
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function sendError(response: Response, status: number, message: string) {
  response.status(status).json({ error: message })
}

function normalizeUsername(value: unknown) {
  if (typeof value !== "string") return undefined
  const username = value.trim().toLowerCase()
  return validUsername.test(username) ? username : undefined
}

function validatePassword(value: unknown): value is string {
  return typeof value === "string" && isValidPasswordLength(value)
}

function publicAdminUser(user: UserRecord) {
  return {
    ...toPublicUser(user),
    isActive: user.is_active === 1,
    createdAt: user.created_at,
  }
}

function getTargetUserId(request: Request) {
  const value = request.params.userId
  if (typeof value !== "string" || !/^\d+$/.test(value)) return undefined
  const id = Number(value)
  return Number.isSafeInteger(id) && id > 0 ? id : undefined
}

function otherActiveAdminExists(database: OrbitDatabase, userId: number) {
  const row = database
    .prepare(
      "SELECT COUNT(*) AS count FROM users WHERE role = 'admin' AND is_active = 1 AND id <> ?"
    )
    .get(userId) as { count: number }
  return row.count > 0
}

export function createApp(
  database: OrbitDatabase,
  config: OrbitRuntimeConfig = loadOrbitConfig()
) {
  const app = express()
  const isProduction = process.env.NODE_ENV === "production"
  const requireAuth = createRequireAuth(
    database,
    config.auth.inactivityTimeoutMinutes
  )
  app.disable("x-powered-by")
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", "data:"],
          fontSrc: ["'self'", "data:"],
          connectSrc: ["'self'"],
          objectSrc: ["'none'"],
          baseUri: ["'self'"],
          frameAncestors: ["'none'"],
          formAction: ["'self'"],
        },
      },
    })
  )
  app.use(express.json({ limit: "16kb", strict: true }))
  app.use("/api", (_request, response, next) => {
    response.setHeader("Cache-Control", "no-store")
    response.setHeader("Pragma", "no-cache")
    next()
  })
  app.use("/api", requireSameOrigin)

  app.get("/api/health", (_request, response) => response.json({ ok: true }))
  app.get("/api/config", (_request, response) => {
    response.json({
      auth: {
        enabled: config.auth.enabled,
        inactivityTimeoutMinutes: config.auth.inactivityTimeoutMinutes,
        warningBeforeTimeoutSeconds: config.auth.warningBeforeTimeoutSeconds,
      },
    })
  })
  const requireAuthEnabled: RequestHandler = (_request, response, next) => {
    if (!config.auth.enabled) {
      sendError(response, 404, "Authentication endpoints are disabled.")
      return
    }
    next()
  }
  app.use("/api/auth", requireAuthEnabled)
  app.use("/api/admin", requireAuthEnabled)
  app.get("/api/auth/me", requireAuth, (request, response) => {
    const user = (request as AuthenticatedRequest).orbitUser
    if (!user) return sendError(response, 401, "Authentication required.")
    response.json({ user: toPublicUser(user) })
  })

  app.post(
    "/api/auth/login",
    loginRateLimit,
    async (request, response, next) => {
      try {
        if (!isRecord(request.body))
          return sendError(response, 400, "Invalid sign-in request.")
        const username = normalizeUsername(request.body.username)
        const password = request.body.password
        if (
          !username ||
          typeof password !== "string" ||
          password.length > 128
        ) {
          return sendError(response, 401, "Invalid username or password.")
        }
        const user = getUserByUsername(database, username)
        const storedHash =
          user?.password_hash ?? (await dummyPasswordHashPromise)
        const passwordMatches = await verifyPassword(password, storedHash)
        if (!user || user.is_active !== 1 || !passwordMatches) {
          return sendError(response, 401, "Invalid username or password.")
        }
        deleteSession(database, currentSessionToken(request))
        issueSession(database, response, user.id, isProduction)
        response.json({ user: toPublicUser(user) })
      } catch (error) {
        next(error)
      }
    }
  )

  app.post("/api/auth/logout", (request, response) => {
    deleteSession(database, currentSessionToken(request))
    clearSessionCookie(response, isProduction)
    response.status(204).end()
  })

  app.post(
    "/api/auth/change-password",
    requireAuth,
    async (request, response, next) => {
      try {
        const authenticated = request as AuthenticatedRequest
        const user = authenticated.orbitUser
        if (!user || !isRecord(request.body)) {
          return sendError(response, 400, "Invalid password change request.")
        }
        const { currentPassword, newPassword } = request.body
        if (!validatePassword(newPassword)) {
          return sendError(
            response,
            400,
            "Use a password between 12 and 128 characters."
          )
        }
        if (
          user.must_change_password !== 1 &&
          (typeof currentPassword !== "string" ||
            !(await verifyPassword(currentPassword, user.password_hash)))
        ) {
          return sendError(response, 400, "Current password is incorrect.")
        }
        if (currentPassword === newPassword) {
          return sendError(
            response,
            400,
            "Choose a password different from the current one."
          )
        }
        const passwordHash = await hashPassword(newPassword)
        const now = new Date().toISOString()
        database
          .prepare(
            "UPDATE users SET password_hash = ?, must_change_password = 0, updated_at = ? WHERE id = ?"
          )
          .run(passwordHash, now, user.id)
        deleteUserSessions(database, user.id)
        const updatedUser = getUserById(database, user.id)
        if (!updatedUser)
          return sendError(response, 401, "Authentication required.")
        issueSession(database, response, user.id, isProduction)
        response.json({ user: toPublicUser(updatedUser) })
      } catch (error) {
        next(error)
      }
    }
  )

  app.get("/api/admin/users", requireAuth, (request, response) => {
    if (!requireAdmin(request, response)) return
    const users = database
      .prepare("SELECT * FROM users ORDER BY created_at DESC, id DESC")
      .all() as UserRecord[]
    response.json({ users: users.map(publicAdminUser) })
  })

  app.post("/api/admin/users", requireAuth, async (request, response, next) => {
    try {
      if (!requireAdmin(request, response)) return
      if (!isRecord(request.body))
        return sendError(response, 400, "Invalid user request.")
      const username = normalizeUsername(request.body.username)
      const displayName =
        typeof request.body.displayName === "string"
          ? request.body.displayName.trim()
          : ""
      const password = request.body.temporaryPassword
      const role = request.body.role
      if (!username)
        return sendError(
          response,
          400,
          "Username must be 3–40 letters, numbers, dots, dashes, or underscores."
        )
      if (displayName.length < 1 || displayName.length > 80) {
        return sendError(
          response,
          400,
          "Display name must be between 1 and 80 characters."
        )
      }
      if (!validatePassword(password)) {
        return sendError(
          response,
          400,
          "Temporary password must be 12–128 characters."
        )
      }
      if (role !== "admin" && role !== "member") {
        return sendError(response, 400, "Choose Admin or Member role.")
      }
      if (getUserByUsername(database, username)) {
        return sendError(response, 409, "That username is already in use.")
      }
      const now = new Date().toISOString()
      const passwordHash = await hashPassword(password)
      const result = database
        .prepare(
          "INSERT INTO users (username, display_name, password_hash, role, is_active, must_change_password, created_at, updated_at) VALUES (?, ?, ?, ?, 1, 1, ?, ?)"
        )
        .run(username, displayName, passwordHash, role, now, now)
      const created = getUserById(database, Number(result.lastInsertRowid))
      if (!created) return sendError(response, 500, "Could not create user.")
      response.status(201).json({ user: publicAdminUser(created) })
    } catch (error) {
      next(error)
    }
  })

  app.patch(
    "/api/admin/users/:userId/role",
    requireAuth,
    (request, response) => {
      if (!requireAdmin(request, response)) return
      const actor = (request as AuthenticatedRequest).orbitUser!
      const userId = getTargetUserId(request)
      if (!userId || !isRecord(request.body))
        return sendError(response, 400, "Invalid role change.")
      const role = request.body.role
      if (role !== "admin" && role !== "member")
        return sendError(response, 400, "Choose Admin or Member role.")
      if (actor.id === userId && role !== "admin") {
        return sendError(
          response,
          400,
          "You cannot remove your own administrator access."
        )
      }
      const target = getUserById(database, userId)
      if (!target) return sendError(response, 404, "User not found.")
      if (
        target.role === "admin" &&
        role === "member" &&
        target.is_active === 1 &&
        !otherActiveAdminExists(database, userId)
      ) {
        return sendError(
          response,
          409,
          "Orbit must keep at least one active administrator."
        )
      }
      database
        .prepare("UPDATE users SET role = ?, updated_at = ? WHERE id = ?")
        .run(role, new Date().toISOString(), userId)
      const updated = getUserById(database, userId)
      if (updated) response.json({ user: publicAdminUser(updated) })
    }
  )

  app.patch(
    "/api/admin/users/:userId/active",
    requireAuth,
    (request, response) => {
      if (!requireAdmin(request, response)) return
      const actor = (request as AuthenticatedRequest).orbitUser!
      const userId = getTargetUserId(request)
      if (
        !userId ||
        !isRecord(request.body) ||
        typeof request.body.isActive !== "boolean"
      ) {
        return sendError(response, 400, "Invalid account status change.")
      }
      if (actor.id === userId && !request.body.isActive) {
        return sendError(
          response,
          400,
          "You cannot deactivate your own account."
        )
      }
      const target = getUserById(database, userId)
      if (!target) return sendError(response, 404, "User not found.")
      if (
        target.role === "admin" &&
        target.is_active === 1 &&
        !request.body.isActive &&
        !otherActiveAdminExists(database, userId)
      ) {
        return sendError(
          response,
          409,
          "Orbit must keep at least one active administrator."
        )
      }
      database
        .prepare("UPDATE users SET is_active = ?, updated_at = ? WHERE id = ?")
        .run(request.body.isActive ? 1 : 0, new Date().toISOString(), userId)
      if (!request.body.isActive) deleteUserSessions(database, userId)
      const updated = getUserById(database, userId)
      if (updated) response.json({ user: publicAdminUser(updated) })
    }
  )

  app.post(
    "/api/admin/users/:userId/temporary-password",
    requireAuth,
    async (request, response, next) => {
      try {
        if (!requireAdmin(request, response)) return
        const actor = (request as AuthenticatedRequest).orbitUser!
        const userId = getTargetUserId(request)
        if (!userId || !isRecord(request.body))
          return sendError(response, 400, "Invalid password reset request.")
        if (actor.id === userId)
          return sendError(
            response,
            400,
            "Use Change password to update your own password."
          )
        const target = getUserById(database, userId)
        if (!target) return sendError(response, 404, "User not found.")
        const temporaryPassword = request.body.temporaryPassword
        if (!validatePassword(temporaryPassword)) {
          return sendError(
            response,
            400,
            "Temporary password must be 12–128 characters."
          )
        }
        const passwordHash = await hashPassword(temporaryPassword)
        database
          .prepare(
            "UPDATE users SET password_hash = ?, must_change_password = 1, updated_at = ? WHERE id = ?"
          )
          .run(passwordHash, new Date().toISOString(), userId)
        deleteUserSessions(database, userId)
        response.status(204).end()
      } catch (error) {
        next(error)
      }
    }
  )

  app.use("/api", (_request, response) =>
    sendError(response, 404, "API endpoint not found.")
  )

  app.use(
    (
      error: unknown,
      _request: Request,
      response: Response,
      _next: (error?: unknown) => void
    ) => {
      void _next
      if (response.headersSent) return
      if (error instanceof SyntaxError)
        return sendError(response, 400, "Invalid JSON request body.")
      console.error("Orbit API request failed:", error)
      sendError(response, 500, "An unexpected server error occurred.")
    }
  )

  const cleanupExpiredSessions = database.prepare(
    "DELETE FROM sessions WHERE expires_at <= ?"
  )
  cleanupExpiredSessions.run(Date.now())
  const cleanupTimer = setInterval(
    () => cleanupExpiredSessions.run(Date.now()),
    60 * 60 * 1000
  )
  cleanupTimer.unref()

  return app
}

export { activeAdminCount }
