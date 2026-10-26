import { createHash, randomBytes } from "node:crypto"
import type { Request, RequestHandler, Response } from "express"
import type { OrbitDatabase, PublicUser, UserRecord } from "./database.js"
import { getUserById, toPublicUser } from "./database.js"

export const SESSION_COOKIE = "orbit_session"
export const SESSION_LIFETIME_MS = 8 * 60 * 60 * 1000

export interface AuthenticatedRequest extends Request {
  orbitUser?: UserRecord
  orbitSessionHash?: string
}

export function hashSessionToken(token: string) {
  return createHash("sha256").update(token).digest("hex")
}

function readCookie(request: Request, name: string) {
  const cookieHeader = request.headers.cookie
  if (!cookieHeader) return undefined
  for (const part of cookieHeader.split(";")) {
    const [key, ...value] = part.trim().split("=")
    if (key === name) return value.join("=") || undefined
  }
  return undefined
}

export function currentSessionToken(request: Request) {
  const token = readCookie(request, SESSION_COOKIE)
  return token && /^[a-f0-9]{64}$/.test(token) ? token : undefined
}

function cookieOptions(isProduction: boolean) {
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax" as const,
    path: "/",
  }
}

export function issueSession(
  database: OrbitDatabase,
  response: Response,
  userId: number,
  isProduction: boolean
) {
  const token = randomBytes(32).toString("hex")
  const tokenHash = hashSessionToken(token)
  const now = Date.now()
  database
    .prepare(
      "INSERT INTO sessions (token_hash, user_id, created_at, expires_at, last_seen_at) VALUES (?, ?, ?, ?, ?)"
    )
    .run(tokenHash, userId, now, now + SESSION_LIFETIME_MS, now)
  response.cookie(SESSION_COOKIE, token, {
    ...cookieOptions(isProduction),
    maxAge: SESSION_LIFETIME_MS,
  })
  return tokenHash
}

export function clearSessionCookie(response: Response, isProduction: boolean) {
  response.clearCookie(SESSION_COOKIE, cookieOptions(isProduction))
}

export function deleteSession(database: OrbitDatabase, token?: string) {
  if (!token) return
  database
    .prepare("DELETE FROM sessions WHERE token_hash = ?")
    .run(hashSessionToken(token))
}

export function deleteUserSessions(database: OrbitDatabase, userId: number) {
  database.prepare("DELETE FROM sessions WHERE user_id = ?").run(userId)
}

export function createRequireAuth(
  database: OrbitDatabase,
  inactivityTimeoutMinutes: number
): RequestHandler {
  return (request, response, next) => {
    const token = currentSessionToken(request)
    if (!token) {
      response.status(401).json({ error: "Authentication required." })
      return
    }
    const tokenHash = hashSessionToken(token)
    const now = Date.now()
    const session = database
      .prepare(
        "SELECT user_id, last_seen_at FROM sessions WHERE token_hash = ? AND expires_at > ?"
      )
      .get(tokenHash, now) as
      { user_id: number; last_seen_at: number } | undefined
    if (!session) {
      response
        .status(401)
        .json({ error: "Your session has expired. Sign in again." })
      return
    }
    const idleLimitMs = inactivityTimeoutMinutes * 60 * 1000
    if (idleLimitMs > 0 && now - session.last_seen_at >= idleLimitMs) {
      database
        .prepare("DELETE FROM sessions WHERE token_hash = ?")
        .run(tokenHash)
      clearSessionCookie(response, process.env.NODE_ENV === "production")
      response
        .status(401)
        .json({ error: "Your session expired due to inactivity." })
      return
    }
    const user = getUserById(database, session.user_id)
    if (!user || user.is_active !== 1) {
      database
        .prepare("DELETE FROM sessions WHERE token_hash = ?")
        .run(tokenHash)
      response.status(401).json({ error: "Authentication required." })
      return
    }
    database
      .prepare("UPDATE sessions SET last_seen_at = ? WHERE token_hash = ?")
      .run(now, tokenHash)
    const authenticated = request as AuthenticatedRequest
    authenticated.orbitUser = user
    authenticated.orbitSessionHash = tokenHash
    next()
  }
}

export function requireAdmin(
  request: Request,
  response: Response
): request is AuthenticatedRequest & { orbitUser: UserRecord } {
  const user = (request as AuthenticatedRequest).orbitUser
  if (!user) {
    response.status(401).json({ error: "Authentication required." })
    return false
  }
  if (user.must_change_password === 1) {
    response
      .status(403)
      .json({ error: "Change your temporary password first." })
    return false
  }
  if (user.role !== "admin") {
    response.status(403).json({ error: "Administrator access is required." })
    return false
  }
  return true
}

export function requireCompletedPasswordChange(
  request: Request,
  response: Response
): request is AuthenticatedRequest & { orbitUser: UserRecord } {
  const user = (request as AuthenticatedRequest).orbitUser
  if (!user) {
    response.status(401).json({ error: "Authentication required." })
    return false
  }
  if (user.must_change_password === 1) {
    response
      .status(403)
      .json({ error: "Change your temporary password first." })
    return false
  }
  return true
}

export function publicUser(user: UserRecord): PublicUser {
  return toPublicUser(user)
}
