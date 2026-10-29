import type { OrbitDatabase } from "./database.js"

export type NotificationFilter = "all" | "unread" | "priority" | "archived"

export interface PersistentNotification {
  id: number
  title: string
  body: string
  priority: boolean
  href: string | null
  sourceDomainId: string | null
  sourceToolId: string | null
  createdAt: string
  readAt: string | null
  archivedAt: string | null
}

export interface CreatePersistentNotificationInput {
  recipientUserId: number
  title: string
  body?: string
  priority?: boolean
  href?: string | null
  sourceDomainId?: string | null
  sourceToolId?: string | null
}

interface NotificationRow {
  id: number
  title: string
  body: string
  priority: 0 | 1
  href: string | null
  source_domain_id: string | null
  source_tool_id: string | null
  created_at: string
  read_at: string | null
  archived_at: string | null
}

function toNotification(row: NotificationRow): PersistentNotification {
  return {
    id: row.id,
    title: row.title,
    body: row.body,
    priority: row.priority === 1,
    href: row.href,
    sourceDomainId: row.source_domain_id,
    sourceToolId: row.source_tool_id,
    createdAt: row.created_at,
    readAt: row.read_at,
    archivedAt: row.archived_at,
  }
}

function isSafeInternalHref(value: string) {
  if (value.length > 2048 || !value.startsWith("/") || value.startsWith("//"))
    return false
  try {
    const decoded = decodeURIComponent(value)
    if (decoded.startsWith("//")) return false
    for (const character of decoded) {
      const codePoint = character.codePointAt(0)
      if (
        character === "\\" ||
        (codePoint !== undefined && (codePoint < 32 || codePoint === 127))
      ) {
        return false
      }
    }
    return (
      new URL(value, "https://orbit.invalid").origin === "https://orbit.invalid"
    )
  } catch {
    return false
  }
}

function normalizeSourceId(value: string | null | undefined, field: string) {
  if (value === undefined || value === null || value === "") return null
  if (typeof value !== "string" || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value)) {
    throw new Error(`${field} must be a lowercase kebab-case identifier.`)
  }
  return value
}

function getNotification(
  database: OrbitDatabase,
  userId: number,
  id: number
): PersistentNotification | undefined {
  const row = database
    .prepare(
      `SELECT id, title, body, priority, href, source_domain_id, source_tool_id,
              created_at, read_at, archived_at
       FROM user_notifications WHERE recipient_user_id = ? AND id = ?`
    )
    .get(userId, id) as NotificationRow | undefined
  return row ? toNotification(row) : undefined
}

/**
 * Persist a notification for a server-selected user. Call from a protected
 * backend operation; never pass a recipient ID taken from an untrusted client.
 */
export function createPersistentNotification(
  database: OrbitDatabase,
  input: CreatePersistentNotificationInput
): PersistentNotification {
  if (
    !Number.isSafeInteger(input.recipientUserId) ||
    input.recipientUserId < 1
  ) {
    throw new Error("A valid recipient user is required.")
  }
  const title = typeof input.title === "string" ? input.title.trim() : ""
  if (input.body !== undefined && typeof input.body !== "string") {
    throw new Error("Notification body must be text.")
  }
  const body = input.body?.trim() ?? ""
  if (title.length < 1 || title.length > 120) {
    throw new Error("Notification titles must contain 1 to 120 characters.")
  }
  if (body.length > 1000) {
    throw new Error("Notification bodies must contain at most 1000 characters.")
  }
  if (input.priority !== undefined && typeof input.priority !== "boolean") {
    throw new Error("Notification priority must be a boolean.")
  }
  const href = input.href ?? null
  if (
    href !== null &&
    (typeof href !== "string" || !isSafeInternalHref(href))
  ) {
    throw new Error("Notification links must be safe, same-origin paths.")
  }
  const sourceDomainId = normalizeSourceId(
    input.sourceDomainId,
    "sourceDomainId"
  )
  const sourceToolId = normalizeSourceId(input.sourceToolId, "sourceToolId")
  if (sourceToolId && !sourceDomainId) {
    throw new Error("A source domain is required when a source tool is set.")
  }

  const activeRecipient = database
    .prepare("SELECT 1 FROM users WHERE id = ? AND is_active = 1")
    .get(input.recipientUserId)
  if (!activeRecipient)
    throw new Error("The notification recipient is unavailable.")

  const createdAt = new Date().toISOString()
  const result = database
    .prepare(
      `INSERT INTO user_notifications
        (recipient_user_id, title, body, priority, href, source_domain_id,
         source_tool_id, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      input.recipientUserId,
      title,
      body,
      input.priority ? 1 : 0,
      href,
      sourceDomainId,
      sourceToolId,
      createdAt
    )
  const notification = getNotification(
    database,
    input.recipientUserId,
    Number(result.lastInsertRowid)
  )
  if (!notification) throw new Error("Could not load the saved notification.")
  return notification
}

export function listUserNotifications(
  database: OrbitDatabase,
  userId: number,
  filter: NotificationFilter,
  cursor: number | null,
  limit: number
) {
  const clauses = ["recipient_user_id = ?"]
  const parameters: (number | string)[] = [userId]
  if (filter === "archived") {
    clauses.push("archived_at IS NOT NULL")
  } else {
    clauses.push("archived_at IS NULL")
    if (filter === "unread") clauses.push("read_at IS NULL")
    if (filter === "priority") clauses.push("priority = 1")
  }
  if (cursor !== null) {
    clauses.push("id < ?")
    parameters.push(cursor)
  }
  parameters.push(limit + 1)
  const rows = database
    .prepare(
      `SELECT id, title, body, priority, href, source_domain_id, source_tool_id,
              created_at, read_at, archived_at
       FROM user_notifications WHERE ${clauses.join(" AND ")}
       ORDER BY id DESC LIMIT ?`
    )
    .all(...parameters) as NotificationRow[]
  const hasMore = rows.length > limit
  const items = rows.slice(0, limit).map(toNotification)
  return {
    items,
    hasMore,
    nextCursor: hasMore ? (items.at(-1)?.id ?? null) : null,
  }
}

export function countUnreadNotifications(
  database: OrbitDatabase,
  userId: number
) {
  const row = database
    .prepare(
      "SELECT COUNT(*) AS count FROM user_notifications WHERE recipient_user_id = ? AND read_at IS NULL AND archived_at IS NULL"
    )
    .get(userId) as { count: number }
  return row.count
}

export function setNotificationRead(
  database: OrbitDatabase,
  userId: number,
  id: number,
  read: boolean
) {
  const changed = database
    .prepare(
      "UPDATE user_notifications SET read_at = ? WHERE recipient_user_id = ? AND id = ?"
    )
    .run(read ? new Date().toISOString() : null, userId, id)
  return changed.changes ? getNotification(database, userId, id) : undefined
}

export function setNotificationArchived(
  database: OrbitDatabase,
  userId: number,
  id: number,
  archived: boolean
) {
  const changed = database
    .prepare(
      "UPDATE user_notifications SET archived_at = ? WHERE recipient_user_id = ? AND id = ?"
    )
    .run(archived ? new Date().toISOString() : null, userId, id)
  return changed.changes ? getNotification(database, userId, id) : undefined
}

export function markAllNotificationsRead(
  database: OrbitDatabase,
  userId: number
) {
  const result = database
    .prepare(
      "UPDATE user_notifications SET read_at = ? WHERE recipient_user_id = ? AND read_at IS NULL AND archived_at IS NULL"
    )
    .run(new Date().toISOString(), userId)
  return result.changes
}
