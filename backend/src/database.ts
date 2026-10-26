import Database from "better-sqlite3"
import { chmodSync, mkdirSync } from "node:fs"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"

const moduleDirectory = dirname(fileURLToPath(import.meta.url))
const dataDirectory = process.env.ORBIT_DATA_DIR
  ? resolve(process.env.ORBIT_DATA_DIR)
  : resolve(moduleDirectory, "../data")

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
  `)
  if (path !== ":memory:") chmodSync(path, 0o600)
  return database
}

export type OrbitDatabase = ReturnType<typeof openDatabase>

export interface UserRecord {
  id: number
  username: string
  display_name: string
  password_hash: string
  role: "admin" | "member"
  is_active: 0 | 1
  must_change_password: 0 | 1
  created_at: string
  updated_at: string
}

export interface PublicUser {
  id: number
  username: string
  displayName: string
  role: "admin" | "member"
  mustChangePassword: boolean
}

export function toPublicUser(user: UserRecord): PublicUser {
  return {
    id: user.id,
    username: user.username,
    displayName: user.display_name,
    role: user.role,
    mustChangePassword: user.must_change_password === 1,
  }
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

export function activeAdminCount(database: OrbitDatabase) {
  const row = database
    .prepare(
      "SELECT COUNT(*) AS count FROM users WHERE role = 'admin' AND is_active = 1"
    )
    .get() as { count: number }
  return row.count
}
