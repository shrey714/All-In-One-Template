import { useCallback, useEffect, useRef, useState } from "react"
import { ApiError } from "@/shared/services/auth-api"
import {
  listNotifications,
  markAllNotificationsRead,
  setNotificationArchived,
  setNotificationRead,
  type InboxNotification,
  type NotificationFilter,
} from "@/shared/services/notification-api"

export function useNotificationInbox({
  enabled,
  userId,
}: {
  enabled: boolean
  userId: number | null
}) {
  const [notifications, setNotifications] = useState<InboxNotification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [filter, setFilter] = useState<NotificationFilter>("all")
  const [hasMore, setHasMore] = useState(false)
  const [nextCursor, setNextCursor] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dataUserId, setDataUserId] = useState(userId)
  const generation = useRef(0)

  const loadPage = useCallback(
    async (
      cursor: number | null,
      append: boolean,
      requestGeneration: number,
      quiet = false
    ) => {
      if (!enabled || userId === null) return
      if (append) setLoadingMore(true)
      else if (!quiet) setLoading(true)
      setError(null)
      try {
        const page = await listNotifications(filter, cursor)
        if (generation.current !== requestGeneration) return
        setNotifications((current) => {
          if (!append) return page.items
          const existingIds = new Set(
            current.map((notification) => notification.id)
          )
          return [
            ...current,
            ...page.items.filter(
              (notification) => !existingIds.has(notification.id)
            ),
          ]
        })
        setUnreadCount(page.unreadCount)
        setHasMore(page.hasMore)
        setNextCursor(page.nextCursor)
      } catch (caught) {
        if (generation.current !== requestGeneration) return
        if (caught instanceof ApiError && [401, 403].includes(caught.status)) {
          setNotifications([])
          setUnreadCount(0)
          setHasMore(false)
          setNextCursor(null)
        }
        setError(
          caught instanceof Error
            ? caught.message
            : "Notifications could not be loaded."
        )
      } finally {
        if (generation.current === requestGeneration) {
          if (!quiet) setLoading(false)
          setLoadingMore(false)
        }
      }
    },
    [enabled, filter, userId]
  )

  useEffect(() => {
    const requestGeneration = ++generation.current
    // Reset immediately when the account or selected filter changes, so one
    // user's notifications are never left on-screen while another is loading.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDataUserId(userId)
    setNotifications([])
    setUnreadCount(0)
    setHasMore(false)
    setNextCursor(null)
    setError(null)
    if (!enabled || userId === null) {
      setLoading(false)
      setLoadingMore(false)
      return () => {
        generation.current += 1
      }
    }

    void loadPage(null, false, requestGeneration)
    const refreshVisible = () => {
      if (document.visibilityState === "visible") {
        void loadPage(null, false, requestGeneration, true)
      }
    }
    const interval = window.setInterval(refreshVisible, 30_000)
    window.addEventListener("focus", refreshVisible)
    document.addEventListener("visibilitychange", refreshVisible)
    return () => {
      generation.current += 1
      window.clearInterval(interval)
      window.removeEventListener("focus", refreshVisible)
      document.removeEventListener("visibilitychange", refreshVisible)
    }
  }, [enabled, filter, loadPage, userId])

  const dataBelongsToCurrentUser = dataUserId === userId

  const refresh = useCallback(() => {
    const requestGeneration = generation.current
    return loadPage(null, false, requestGeneration)
  }, [loadPage])

  const loadMore = useCallback(() => {
    if (!hasMore || nextCursor === null || loadingMore) return Promise.resolve()
    return loadPage(nextCursor, true, generation.current)
  }, [hasMore, loadPage, loadingMore, nextCursor])

  const toggleRead = useCallback(
    async (notification: InboxNotification) => {
      const requestGeneration = generation.current
      setError(null)
      try {
        const result = await setNotificationRead(
          notification.id,
          notification.readAt === null
        )
        if (generation.current !== requestGeneration) return
        setNotifications((current) => {
          if (filter === "unread" && result.notification.readAt !== null) {
            return current.filter((item) => item.id !== notification.id)
          }
          return current.map((item) =>
            item.id === notification.id ? result.notification : item
          )
        })
        setUnreadCount(result.unreadCount)
      } catch (caught) {
        if (generation.current === requestGeneration) {
          setError(
            caught instanceof Error
              ? caught.message
              : "Notification state could not be updated."
          )
        }
      }
    },
    [filter]
  )

  const markAllRead = useCallback(async () => {
    const requestGeneration = generation.current
    setError(null)
    try {
      const result = await markAllNotificationsRead()
      if (generation.current !== requestGeneration) return
      const readAt = new Date().toISOString()
      if (filter === "unread") {
        setNotifications([])
        setHasMore(false)
        setNextCursor(null)
      } else {
        setNotifications((current) =>
          current.map((item) =>
            item.archivedAt === null
              ? { ...item, readAt: item.readAt ?? readAt }
              : item
          )
        )
      }
      setUnreadCount(result.unreadCount)
    } catch (caught) {
      if (generation.current === requestGeneration) {
        setError(
          caught instanceof Error
            ? caught.message
            : "Notifications could not be marked as read."
        )
      }
    }
  }, [filter])

  const toggleArchived = useCallback(
    async (notification: InboxNotification) => {
      const requestGeneration = generation.current
      setError(null)
      try {
        const result = await setNotificationArchived(
          notification.id,
          notification.archivedAt === null
        )
        if (generation.current !== requestGeneration) return
        setNotifications((current) =>
          current.filter((item) => item.id !== notification.id)
        )
        setUnreadCount(result.unreadCount)
        setHasMore(true)
      } catch (caught) {
        if (generation.current === requestGeneration) {
          setError(
            caught instanceof Error
              ? caught.message
              : "Notification could not be archived."
          )
        }
      }
    },
    []
  )

  return {
    notifications: dataBelongsToCurrentUser ? notifications : [],
    unreadCount: dataBelongsToCurrentUser ? unreadCount : 0,
    filter,
    setFilter,
    hasMore,
    loading: dataBelongsToCurrentUser ? loading : true,
    loadingMore,
    error,
    refresh,
    loadMore,
    toggleRead,
    markAllRead,
    toggleArchived,
  }
}
