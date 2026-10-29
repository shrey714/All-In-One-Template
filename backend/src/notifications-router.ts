import { Router, type Request, type Response } from "express"
import type { OrbitDatabase } from "./database.js"
import {
  countUnreadNotifications,
  listUserNotifications,
  markAllNotificationsRead,
  setNotificationArchived,
  setNotificationRead,
  type NotificationFilter,
} from "./notifications-store.js"
import {
  createRequireAuth,
  requirePermission,
  type AuthenticatedRequest,
} from "./sessions.js"

function fail(response: Response, status: number, error: string) {
  response.status(status).json({ error })
}

function currentUserId(request: Request) {
  return (request as AuthenticatedRequest).orbitUser?.id
}

function parseId(value: unknown) {
  if (typeof value !== "string" || !/^\d+$/.test(value)) return undefined
  const id = Number(value)
  return Number.isSafeInteger(id) && id > 0 ? id : undefined
}

function parseCursor(value: unknown) {
  if (value === undefined) return null
  if (typeof value !== "string" || !/^\d+$/.test(value)) return undefined
  const cursor = Number(value)
  return Number.isSafeInteger(cursor) && cursor > 0 ? cursor : undefined
}

function parseLimit(value: unknown) {
  if (value === undefined) return 30
  if (typeof value !== "string" || !/^\d+$/.test(value)) return undefined
  const limit = Number(value)
  return Number.isSafeInteger(limit) && limit >= 1 && limit <= 50
    ? limit
    : undefined
}

const filters = new Set<NotificationFilter>([
  "all",
  "unread",
  "priority",
  "archived",
])

export function createNotificationsRouter(
  database: OrbitDatabase,
  inactivityTimeoutMinutes: number
) {
  const router = Router()
  router.use(createRequireAuth(database, inactivityTimeoutMinutes))
  router.use((request, response, next) => {
    if (requirePermission(request, response, "dashboard:access")) next()
  })

  router.get("/", (request, response) => {
    const userId = currentUserId(request)
    if (!userId) return fail(response, 401, "Authentication required.")
    const rawFilter = request.query.filter
    const filter = rawFilter === undefined ? "all" : rawFilter
    const cursor = parseCursor(request.query.cursor)
    const limit = parseLimit(request.query.limit)
    if (
      typeof filter !== "string" ||
      !filters.has(filter as NotificationFilter) ||
      cursor === undefined ||
      limit === undefined
    ) {
      return fail(response, 400, "Notification list parameters are invalid.")
    }
    const page = listUserNotifications(
      database,
      userId,
      filter as NotificationFilter,
      cursor,
      limit
    )
    response.json({
      ...page,
      unreadCount: countUnreadNotifications(database, userId),
    })
  })

  router.post("/read-all", (request, response) => {
    const userId = currentUserId(request)
    if (!userId) return fail(response, 401, "Authentication required.")
    const updated = markAllNotificationsRead(database, userId)
    response.json({
      updated,
      unreadCount: countUnreadNotifications(database, userId),
    })
  })

  router.patch("/:id/read", (request, response) => {
    const userId = currentUserId(request)
    const id = parseId(request.params.id)
    if (!userId) return fail(response, 401, "Authentication required.")
    if (!id || !request.body || typeof request.body.read !== "boolean") {
      return fail(response, 400, "Notification read state is invalid.")
    }
    const notification = setNotificationRead(
      database,
      userId,
      id,
      request.body.read
    )
    if (!notification) return fail(response, 404, "Notification not found.")
    response.json({
      notification,
      unreadCount: countUnreadNotifications(database, userId),
    })
  })

  router.patch("/:id/archive", (request, response) => {
    const userId = currentUserId(request)
    const id = parseId(request.params.id)
    if (!userId) return fail(response, 401, "Authentication required.")
    if (!id || !request.body || typeof request.body.archived !== "boolean") {
      return fail(response, 400, "Notification archive state is invalid.")
    }
    const notification = setNotificationArchived(
      database,
      userId,
      id,
      request.body.archived
    )
    if (!notification) return fail(response, 404, "Notification not found.")
    response.json({
      notification,
      unreadCount: countUnreadNotifications(database, userId),
    })
  })

  return router
}
