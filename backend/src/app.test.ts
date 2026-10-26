import assert from "node:assert/strict"
import { createServer, type Server } from "node:http"
import test, { after, before } from "node:test"
import Database from "better-sqlite3"
import { createApp } from "./app.js"
import { hashPassword } from "./password.js"
import { hashSessionToken } from "./sessions.js"

const ADMIN_PASSWORD = "FirstAdmin-password-9876"
const MEMBER_TEMP_PASSWORD = "Temporary-member-Password-123"
const MEMBER_NEW_PASSWORD = "Member-new-password-456789"
const MEMBER_RESET_PASSWORD = "Reset-member-password-789012"
let database: Database.Database
let server: Server
let baseUrl = ""

before(async () => {
  database = new Database(":memory:")
  database.pragma("foreign_keys = ON")
  database.exec(`
    CREATE TABLE users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL COLLATE NOCASE UNIQUE,
      display_name TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK (role IN ('admin', 'member')),
      is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
      must_change_password INTEGER NOT NULL DEFAULT 0 CHECK (must_change_password IN (0, 1)),
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE TABLE sessions (
      token_hash TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at INTEGER NOT NULL,
      expires_at INTEGER NOT NULL,
      last_seen_at INTEGER NOT NULL
    );
  `)
  const passwordHash = await hashPassword(ADMIN_PASSWORD)
  const now = new Date().toISOString()
  database
    .prepare(
      "INSERT INTO users (username, display_name, password_hash, role, is_active, must_change_password, created_at, updated_at) VALUES ('rootadmin', 'Orbit Admin', ?, 'admin', 1, 0, ?, ?)"
    )
    .run(passwordHash, now, now)
  server = createServer(createApp(database))
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve))
  const address = server.address()
  assert.ok(address && typeof address !== "string")
  baseUrl = `http://127.0.0.1:${address.port}`
})

after(async () => {
  await new Promise<void>((resolve, reject) =>
    server.close((error) => (error ? reject(error) : resolve()))
  )
  database.close()
})

async function call(
  path: string,
  options: { method?: string; cookie?: string; body?: unknown } = {}
) {
  const method = options.method ?? "GET"
  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers: {
      ...(method !== "GET" ? { Origin: baseUrl } : {}),
      ...(options.body !== undefined
        ? { "Content-Type": "application/json" }
        : {}),
      ...(options.cookie ? { Cookie: options.cookie } : {}),
    },
    ...(options.body !== undefined
      ? { body: JSON.stringify(options.body) }
      : {}),
  })
  return response
}

function sessionCookie(response: Response) {
  const value = response.headers.get("set-cookie")
  assert.ok(value, "expected the server to set a session cookie")
  assert.match(value, /HttpOnly/i)
  assert.match(value, /SameSite=Lax/i)
  return value.split(";")[0]!
}

test("username/password auth, session lifecycle, no public signup, and admin/member RBAC", async () => {
  const runtimeConfig = await call("/api/config")
  assert.equal(runtimeConfig.status, 200)
  const runtimeSettings = (await runtimeConfig.json()) as {
    auth: { enabled: boolean; inactivityTimeoutMinutes: number }
  }
  assert.equal(runtimeSettings.auth.enabled, true)
  assert.equal(runtimeSettings.auth.inactivityTimeoutMinutes, 30)

  const anonymous = await call("/api/auth/me")
  assert.equal(anonymous.status, 401)

  const signup = await call("/api/auth/register", {
    method: "POST",
    body: { username: "open-signup", password: ADMIN_PASSWORD },
  })
  assert.equal(
    signup.status,
    404,
    "public registration endpoint must not exist"
  )

  const invalidLogin = await call("/api/auth/login", {
    method: "POST",
    body: { username: "rootadmin", password: "wrong-password" },
  })
  assert.equal(invalidLogin.status, 401)

  const adminLogin = await call("/api/auth/login", {
    method: "POST",
    body: { username: "ROOTADMIN", password: ADMIN_PASSWORD },
  })
  assert.equal(adminLogin.status, 200)
  const adminCookie = sessionCookie(adminLogin)
  const adminPayload = (await adminLogin.json()) as {
    user: { role: string; mustChangePassword: boolean }
  }
  assert.equal(adminPayload.user.role, "admin")
  assert.equal(adminPayload.user.mustChangePassword, false)

  const createMember = await call("/api/admin/users", {
    method: "POST",
    cookie: adminCookie,
    body: {
      username: "member.one",
      displayName: "Member One",
      role: "member",
      temporaryPassword: MEMBER_TEMP_PASSWORD,
    },
  })
  assert.equal(createMember.status, 201)
  const memberPayload = (await createMember.json()) as {
    user: { id: number; role: string; mustChangePassword: boolean }
  }
  assert.equal(memberPayload.user.role, "member")
  assert.equal(memberPayload.user.mustChangePassword, true)
  const memberId = memberPayload.user.id

  const duplicate = await call("/api/admin/users", {
    method: "POST",
    cookie: adminCookie,
    body: {
      username: "MEMBER.ONE",
      displayName: "Duplicate",
      role: "member",
      temporaryPassword: MEMBER_TEMP_PASSWORD,
    },
  })
  assert.equal(
    duplicate.status,
    409,
    "usernames are case-insensitive and unique"
  )

  const memberLogin = await call("/api/auth/login", {
    method: "POST",
    body: { username: "member.one", password: MEMBER_TEMP_PASSWORD },
  })
  assert.equal(memberLogin.status, 200)
  const memberCookie = sessionCookie(memberLogin)
  const forcedChange = (await memberLogin.json()) as {
    user: { mustChangePassword: boolean }
  }
  assert.equal(forcedChange.user.mustChangePassword, true)

  const forbiddenAdminRead = await call("/api/admin/users", {
    cookie: memberCookie,
  })
  assert.equal(forbiddenAdminRead.status, 403)

  const memberChange = await call("/api/auth/change-password", {
    method: "POST",
    cookie: memberCookie,
    body: { newPassword: MEMBER_NEW_PASSWORD },
  })
  assert.equal(memberChange.status, 200)
  const renewedMemberCookie = sessionCookie(memberChange)
  const changedPayload = (await memberChange.json()) as {
    user: { mustChangePassword: boolean }
  }
  assert.equal(changedPayload.user.mustChangePassword, false)

  const oldMemberSession = await call("/api/auth/me", { cookie: memberCookie })
  assert.equal(
    oldMemberSession.status,
    401,
    "password change revokes previous sessions"
  )
  const memberMe = await call("/api/auth/me", { cookie: renewedMemberCookie })
  assert.equal(memberMe.status, 200)

  const promoteMember = await call(`/api/admin/users/${memberId}/role`, {
    method: "PATCH",
    cookie: adminCookie,
    body: { role: "admin" },
  })
  assert.equal(promoteMember.status, 200)
  const promotedCanAccessAdmin = await call("/api/admin/users", {
    cookie: renewedMemberCookie,
  })
  assert.equal(
    promotedCanAccessAdmin.status,
    200,
    "role changes take effect from the user store on each request"
  )

  const preventSelfDemotion = await call(`/api/admin/users/${memberId}/role`, {
    method: "PATCH",
    cookie: renewedMemberCookie,
    body: { role: "member" },
  })
  assert.equal(preventSelfDemotion.status, 400)

  const passwordReset = await call(
    `/api/admin/users/${memberId}/temporary-password`,
    {
      method: "POST",
      cookie: adminCookie,
      body: { temporaryPassword: MEMBER_RESET_PASSWORD },
    }
  )
  assert.equal(passwordReset.status, 204)
  const revokedByAdminReset = await call("/api/auth/me", {
    cookie: renewedMemberCookie,
  })
  assert.equal(revokedByAdminReset.status, 401)

  const temporaryLogin = await call("/api/auth/login", {
    method: "POST",
    body: { username: "member.one", password: MEMBER_RESET_PASSWORD },
  })
  assert.equal(temporaryLogin.status, 200)
  const temporarySessionCookie = sessionCookie(temporaryLogin)
  const resetLoginPayload = (await temporaryLogin.json()) as {
    user: { mustChangePassword: boolean }
  }
  assert.equal(resetLoginPayload.user.mustChangePassword, true)

  const deactivateMember = await call(`/api/admin/users/${memberId}/active`, {
    method: "PATCH",
    cookie: adminCookie,
    body: { isActive: false },
  })
  assert.equal(deactivateMember.status, 200)
  const deactivatedSession = await call("/api/auth/me", {
    cookie: temporarySessionCookie,
  })
  assert.equal(deactivatedSession.status, 401)
  const inactiveLogin = await call("/api/auth/login", {
    method: "POST",
    body: { username: "member.one", password: MEMBER_RESET_PASSWORD },
  })
  assert.equal(inactiveLogin.status, 401)

  const reactivateMember = await call(`/api/admin/users/${memberId}/active`, {
    method: "PATCH",
    cookie: adminCookie,
    body: { isActive: true },
  })
  assert.equal(reactivateMember.status, 200)
  const reactivatedLogin = await call("/api/auth/login", {
    method: "POST",
    body: { username: "member.one", password: MEMBER_RESET_PASSWORD },
  })
  assert.equal(reactivatedLogin.status, 200)
  const reactivatedSessionCookie = sessionCookie(reactivatedLogin)
  const reactivatedPayload = (await reactivatedLogin.json()) as {
    user: { mustChangePassword: boolean }
  }
  assert.equal(reactivatedPayload.user.mustChangePassword, true)

  const logout = await call("/api/auth/logout", {
    method: "POST",
    cookie: reactivatedSessionCookie,
  })
  assert.equal(logout.status, 204)
  const afterLogout = await call("/api/auth/me", {
    cookie: reactivatedSessionCookie,
  })
  assert.equal(afterLogout.status, 401)

  const idleLogin = await call("/api/auth/login", {
    method: "POST",
    body: { username: "rootadmin", password: ADMIN_PASSWORD },
  })
  assert.equal(idleLogin.status, 200)
  const idleCookie = sessionCookie(idleLogin)
  const idleToken = idleCookie.split("=")[1]
  assert.ok(idleToken)
  database
    .prepare("UPDATE sessions SET last_seen_at = ? WHERE token_hash = ?")
    .run(Date.now() - 31 * 60 * 1000, hashSessionToken(idleToken))
  const inactivityExpiry = await call("/api/auth/me", { cookie: idleCookie })
  assert.equal(inactivityExpiry.status, 401)
  assert.match(
    inactivityExpiry.headers.get("set-cookie") ?? "",
    /Expires=Thu, 01 Jan 1970/i
  )
  assert.match(
    ((await inactivityExpiry.json()) as { error: string }).error,
    /inactivity/i
  )
})

test("disabling auth disables sign-in and administrative endpoints", async () => {
  const disabledServer = createServer(
    createApp(database, {
      auth: {
        enabled: false,
        inactivityTimeoutMinutes: 30,
        warningBeforeTimeoutSeconds: 60,
      },
    })
  )
  await new Promise<void>((resolve) =>
    disabledServer.listen(0, "127.0.0.1", resolve)
  )
  try {
    const address = disabledServer.address()
    assert.ok(address && typeof address !== "string")
    const origin = `http://127.0.0.1:${address.port}`
    const configResponse = await fetch(`${origin}/api/config`)
    assert.equal(configResponse.status, 200)
    const config = (await configResponse.json()) as {
      auth: { enabled: boolean }
    }
    assert.equal(config.auth.enabled, false)
    const login = await fetch(`${origin}/api/auth/login`, {
      method: "POST",
      headers: { Origin: origin },
    })
    assert.equal(login.status, 404)
    const adminUsers = await fetch(`${origin}/api/admin/users`)
    assert.equal(adminUsers.status, 404)
  } finally {
    await new Promise<void>((resolve, reject) =>
      disabledServer.close((error) => (error ? reject(error) : resolve()))
    )
  }
})
