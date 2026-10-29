import { requestApi } from "@/shared/services/auth-api"

export type NotificationFilter = "all" | "unread" | "priority" | "archived"

export interface InboxNotification {
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

export interface NotificationPage {
  items: InboxNotification[]
  unreadCount: number
  hasMore: boolean
  nextCursor: number | null
}

export interface NotificationMutationResult {
  notification: InboxNotification
  unreadCount: number
}

export interface MarkAllReadResult {
  updated: number
  unreadCount: number
}

export function listNotifications(
  filter: NotificationFilter,
  cursor: number | null,
  limit = 30
) {
  const params = new URLSearchParams({ filter, limit: String(limit) })
  if (cursor !== null) params.set("cursor", String(cursor))
  return requestApi<NotificationPage>(`/api/notifications?${params.toString()}`)
}

export function setNotificationRead(id: number, read: boolean) {
  return requestApi<NotificationMutationResult>(
    `/api/notifications/${id}/read`,
    { method: "PATCH", body: JSON.stringify({ read }) }
  )
}

export function markAllNotificationsRead() {
  return requestApi<MarkAllReadResult>("/api/notifications/read-all", {
    method: "POST",
  })
}

export function setNotificationArchived(id: number, archived: boolean) {
  return requestApi<NotificationMutationResult>(
    `/api/notifications/${id}/archive`,
    { method: "PATCH", body: JSON.stringify({ archived }) }
  )
}
