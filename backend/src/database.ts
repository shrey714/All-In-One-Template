import Database from "better-sqlite3"
import { chmodSync, mkdirSync } from "node:fs"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import { BUILT_IN_ROLES, type UserRole } from "./permissions.js"

const moduleDirectory = dirname(fileURLToPath(import.meta.url))
const dataDirectory = process.env.ORBIT_DATA_DIR
  ? resolve(process.env.ORBIT_DATA_DIR)
  : resolve(moduleDirectory, "../data")

export interface RoleSummary {
  id: string
  name: string
  isBuiltIn: boolean
  isAssignable: boolean
}

export interface RoleDefinition extends RoleSummary {
  description: string
  grants: string[]
}

export function openDatabase(path = resolve(dataDirectory, "orbit.sqlite")) {
  if (path !== ":memory:")
    mkdirSync(dirname(path), { recursive: true, mode: 0o700 })
  const database = new Database(path)
  database.pragma("journal_mode = WAL")
  database.pragma("foreign_keys = ON")
  database.pragma("secure_delete = ON")
  database.exec(`
    CREATE TABLE IF NOT EXISTS users (
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
    CREATE TABLE IF NOT EXISTS sessions (
      token_hash TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at INTEGER NOT NULL,
      expires_at INTEGER NOT NULL,
      last_seen_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS sessions_user_id_idx ON sessions(user_id);
    CREATE INDEX IF NOT EXISTS sessions_expiry_idx ON sessions(expires_at);
    CREATE TABLE IF NOT EXISTS roles (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE COLLATE NOCASE,
      description TEXT NOT NULL DEFAULT '',
      is_builtin INTEGER NOT NULL DEFAULT 0 CHECK (is_builtin IN (0, 1)),
      is_assignable INTEGER NOT NULL DEFAULT 1 CHECK (is_assignable IN (0, 1)),
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS role_grants (
      role_id TEXT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
      grant_key TEXT NOT NULL,
      PRIMARY KEY (role_id, grant_key)
    );
    CREATE TABLE IF NOT EXISTS user_roles (
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      role_id TEXT NOT NULL REFERENCES roles(id) ON DELETE RESTRICT,
      assigned_at TEXT NOT NULL,
      assigned_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
      PRIMARY KEY (user_id, role_id)
    );
    CREATE INDEX IF NOT EXISTS user_roles_role_idx ON user_roles(role_id);
    CREATE TABLE IF NOT EXISTS authorization_audit (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      actor_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      action TEXT NOT NULL,
      subject_type TEXT NOT NULL,
      subject_id TEXT NOT NULL,
      details_json TEXT NOT NULL DEFAULT '{}',
      created_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS authorization_audit_created_idx
      ON authorization_audit(created_at);
  `)
  seedBuiltInRoles(database)
  if (path !== ":memory:") chmodSync(path, 0o600)
  return database
}

function seedBuiltInRoles(database: OrbitDatabase) {
  const previousVersion = database.pragma("user_version", {
    simple: true,
  }) as number
  const now = new Date().toISOString()
  const insertRole = database.prepare(
    "INSERT OR IGNORE INTO roles (id, name, description, is_builtin, is_assignable, created_at, updated_at) VALUES (?, ?, ?, 1, ?, ?, ?)"
  )
  const insertGrant = database.prepare(
    "INSERT OR IGNORE INTO role_grants (role_id, grant_key) VALUES (?, ?)"
  )
  const seed = database.transaction(() => {
    for (const role of BUILT_IN_ROLES) {
      insertRole.run(
        role.id,
        role.name,
        role.description,
        role.assignable ? 1 : 0,
        now,
        now
      )
      for (const grant of role.grants) insertGrant.run(role.id, grant)
    }

    if (previousVersion < 3) {
      database
        .prepare(
          "DELETE FROM role_grants WHERE grant_key = 'users:manage-roles'"
        )
        .run()
      const legacyUsers = database
        .prepare(
          `SELECT u.id, u.role, u.is_active FROM users u
           WHERE NOT EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = u.id)
           ORDER BY u.created_at ASC, u.id ASC`
        )
        .all() as Array<{
        id: number
        role: UserRole
        is_active: 0 | 1
      }>
      const activeSystemAdmins = database
        .prepare(
          `SELECT COUNT(*) AS count FROM user_roles ur
           JOIN users u ON u.id = ur.user_id
           WHERE ur.role_id = 'system-admin' AND u.is_active = 1`
        )
        .get() as { count: number }
      let assignedSystemAdmin = activeSystemAdmins.count > 0
      for (const user of legacyUsers) {
        const becomesSystemAdmin =
          user.role === "admin" && user.is_active === 1 && !assignedSystemAdmin
        const roleIds = becomesSystemAdmin
          ? ["system-admin"]
          : user.role === "admin"
            ? ["access-manager", "all-tools-user"]
            : ["all-tools-user"]
        if (becomesSystemAdmin) assignedSystemAdmin = true
        const insertAssignment = database.prepare(
          "INSERT OR IGNORE INTO user_roles (user_id, role_id, assigned_at) VALUES (?, ?, ?)"
        )
        for (const roleId of roleIds) insertAssignment.run(user.id, roleId, now)
      }
    }

    const activeSystemAdmin = database
      .prepare(
        `SELECT COUNT(*) AS count FROM user_roles ur
         JOIN users u ON u.id = ur.user_id
         WHERE ur.role_id = 'system-admin' AND u.is_active = 1`
      )
      .get() as { count: number }
    if (activeSystemAdmin.count === 0) {
      const legacyAdmin = database
        .prepare(
          "SELECT id FROM users WHERE role = 'admin' AND is_active = 1 ORDER BY created_at ASC, id ASC LIMIT 1"
        )
        .get() as { id: number } | undefined
      if (legacyAdmin) {
        database
          .prepare(
            "INSERT OR IGNORE INTO user_roles (user_id, role_id, assigned_at) VALUES (?, 'system-admin', ?)"
          )
          .run(legacyAdmin.id, now)
      }
    }
    database.pragma("user_version = 3")
  })
  seed()
}

export type OrbitDatabase = ReturnType<typeof openDatabase>

export interface UserRecord {
  id: number
  username: string
  display_name: string
  password_hash: string
  /** Legacy account label retained for migration/display; never used for authorization. */
  role: UserRole
  is_active: 0 | 1
  must_change_password: 0 | 1
  created_at: string
  updated_at: string
}

export interface PublicUser {
  id: number
  username: string
  displayName: string
  /** Legacy label only. Authorization uses roles and grants. */
  role: UserRole
  roles: RoleSummary[]
  permissions: string[]
  mustChangePassword: boolean
}

export function getUserById(database: OrbitDatabase, id: number) {
  return database.prepare("SELECT * FROM users WHERE id = ?").get(id) as
    UserRecord | undefined
}

export function getUserByUsername(database: OrbitDatabase, username: string) {
  return database
    .prepare("SELECT * FROM users WHERE username = ? COLLATE NOCASE")
    .get(username) as UserRecord | undefined
}

export function getUserRoles(
  database: OrbitDatabase,
  userId: number
): RoleSummary[] {
  return database
    .prepare(
      `SELECT r.id, r.name, r.is_builtin AS isBuiltIn, r.is_assignable AS isAssignable
       FROM user_roles ur JOIN roles r ON r.id = ur.role_id
       WHERE ur.user_id = ? ORDER BY r.name COLLATE NOCASE`
    )
    .all(userId)
    .map((row) => {
      const role = row as {
        id: string
        name: string
        isBuiltIn: 0 | 1
        isAssignable: 0 | 1
      }
      return {
        id: role.id,
        name: role.name,
        isBuiltIn: role.isBuiltIn === 1,
        isAssignable: role.isAssignable === 1,
      }
    })
}

export function getUserPermissions(database: OrbitDatabase, userId: number) {
  return database
    .prepare(
      `SELECT DISTINCT rg.grant_key AS grantKey
       FROM user_roles ur JOIN role_grants rg ON rg.role_id = ur.role_id
       WHERE ur.user_id = ? ORDER BY rg.grant_key`
    )
    .all(userId)
    .map((row) => (row as { grantKey: string }).grantKey)
}

export function hasUserPermission(
  database: OrbitDatabase,
  userId: number,
  permission: string
) {
  return getUserPermissions(database, userId).some(
    (grant) => grant === "*" || grant === permission
  )
}

export function isSystemAdmin(database: OrbitDatabase, userId: number) {
  return Boolean(
    database
      .prepare(
        "SELECT 1 FROM user_roles WHERE user_id = ? AND role_id = 'system-admin'"
      )
      .get(userId)
  )
}

export function establishSystemAdmin(database: OrbitDatabase, userId: number) {
  if (activeAdminCount(database) > 0)
    throw new Error("A protected System administrator already exists.")
  database
    .prepare(
      "INSERT INTO user_roles (user_id, role_id, assigned_at) VALUES (?, 'system-admin', ?)"
    )
    .run(userId, new Date().toISOString())
}

export function listRoles(database: OrbitDatabase): RoleDefinition[] {
  const roles = database
    .prepare(
      `SELECT id, name, description, is_builtin AS isBuiltIn, is_assignable AS isAssignable
       FROM roles ORDER BY is_builtin DESC, name COLLATE NOCASE`
    )
    .all() as Array<{
    id: string
    name: string
    description: string
    isBuiltIn: 0 | 1
    isAssignable: 0 | 1
  }>
  const grants = database.prepare(
    "SELECT grant_key FROM role_grants WHERE role_id = ? ORDER BY grant_key"
  )
  return roles.map((role) => ({
    id: role.id,
    name: role.name,
    description: role.description,
    isBuiltIn: role.isBuiltIn === 1,
    isAssignable: role.isAssignable === 1,
    grants: grants
      .all(role.id)
      .map((row) => (row as { grant_key: string }).grant_key),
  }))
}

export function toPublicUser(
  database: OrbitDatabase,
  user: UserRecord
): PublicUser {
  return {
    id: user.id,
    username: user.username,
    displayName: user.display_name,
    role: user.role,
    roles: getUserRoles(database, user.id),
    permissions: getUserPermissions(database, user.id),
    mustChangePassword: user.must_change_password === 1,
  }
}

export function validateRoleSelection(
  database: OrbitDatabase,
  roleIds: string[],
  assignedBy: number
) {
  const normalized = [...new Set(roleIds)]
  if (normalized.length !== roleIds.length) {
    throw new Error("A role may only be assigned once.")
  }
  const eligible = database
    .prepare(
      `SELECT id FROM roles WHERE is_assignable = 1 AND id IN (${normalized.map(() => "?").join(",") || "NULL"})`
    )
    .all(...normalized) as Array<{ id: string }>
  if (eligible.length !== normalized.length) {
    throw new Error("One or more roles are missing or cannot be assigned.")
  }
  const actorGrants = getUserPermissions(database, assignedBy)
  if (!actorGrants.includes("*")) {
    const grants = database
      .prepare(
        `SELECT DISTINCT grant_key AS grantKey FROM role_grants
         WHERE role_id IN (${normalized.map(() => "?").join(",") || "NULL"})`
      )
      .all(...normalized) as Array<{ grantKey: string }>
    if (grants.some(({ grantKey }) => !actorGrants.includes(grantKey))) {
      throw new Error(
        "You may only assign roles with permissions you already hold."
      )
    }
  }
  return normalized
}

export function assignRoles(
  database: OrbitDatabase,
  userId: number,
  roleIds: string[],
  assignedBy: number
) {
  if (userId === assignedBy) {
    throw new Error("You cannot change your own role assignments.")
  }
  if (isSystemAdmin(database, userId)) {
    throw new Error(
      "The protected System administrator role cannot be changed."
    )
  }
  const normalized = validateRoleSelection(database, roleIds, assignedBy)
  const now = new Date().toISOString()
  const update = database.transaction(() => {
    database.prepare("DELETE FROM user_roles WHERE user_id = ?").run(userId)
    const insert = database.prepare(
      "INSERT INTO user_roles (user_id, role_id, assigned_at, assigned_by) VALUES (?, ?, ?, ?)"
    )
    for (const roleId of normalized) insert.run(userId, roleId, now, assignedBy)
  })
  update()
}

export function writeAuthorizationAudit(
  database: OrbitDatabase,
  actorUserId: number,
  action: string,
  subjectType: string,
  subjectId: string,
  details: Record<string, unknown> = {}
) {
  database
    .prepare(
      "INSERT INTO authorization_audit (actor_user_id, action, subject_type, subject_id, details_json, created_at) VALUES (?, ?, ?, ?, ?, ?)"
    )
    .run(
      actorUserId,
      action,
      subjectType,
      subjectId,
      JSON.stringify(details),
      new Date().toISOString()
    )
}

export function activeAdminCount(database: OrbitDatabase) {
  const row = database
    .prepare(
      `SELECT COUNT(*) AS count FROM user_roles ur
       JOIN users u ON u.id = ur.user_id
       WHERE ur.role_id = 'system-admin' AND u.is_active = 1`
    )
    .get() as { count: number }
  return row.count
}
