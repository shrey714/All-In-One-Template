import { Link } from "react-router-dom"
import {
  Archive,
  ArchiveRestore,
  Bell,
  CheckCheck,
  Circle,
  Inbox,
  Mail,
  MailOpen,
  ShieldAlert,
} from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import { getDomain, getTool } from "@/shared/config/registry"
import type {
  InboxNotification,
  NotificationFilter,
} from "@/shared/services/notification-api"

const filters: { id: NotificationFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "unread", label: "Unread" },
  { id: "priority", label: "Priority" },
  { id: "archived", label: "Archived" },
]

type Props = {
  available: boolean
  unavailableMessage: string
  notifications: InboxNotification[]
  unreadCount: number
  filter: NotificationFilter
  onFilterChange: (filter: NotificationFilter) => void
  loading: boolean
  loadingMore: boolean
  hasMore: boolean
  error: string | null
  onRetry: () => void
  onLoadMore: () => void
  onToggleRead: (notification: InboxNotification) => void
  onMarkAllRead: () => void
  onToggleArchived: (notification: InboxNotification) => void
}

export function NotificationInboxPanel({
  available,
  unavailableMessage,
  notifications,
  unreadCount,
  filter,
  onFilterChange,
  loading,
  loadingMore,
  hasMore,
  error,
  onRetry,
  onLoadMore,
  onToggleRead,
  onMarkAllRead,
  onToggleArchived,
}: Props) {
  if (!available) {
    return (
      <div className="flex min-h-48 flex-col items-center justify-center gap-2 px-5 py-8 text-center">
        <ShieldAlert className="size-5 text-muted-foreground" />
        <p className="text-xs font-medium">Inbox unavailable</p>
        <p className="max-w-56 text-[11px] text-muted-foreground">
          {unavailableMessage}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-2 pb-2">
      <div className="grid grid-cols-4 gap-1 px-1 pt-1">
        {filters.map((item) => (
          <Button
            key={item.id}
            type="button"
            variant={filter === item.id ? "secondary" : "ghost"}
            size="sm"
            aria-pressed={filter === item.id}
            onClick={() => onFilterChange(item.id)}
            className="h-7 min-w-0 px-1 text-[10px]"
          >
            {item.label}
          </Button>
        ))}
      </div>

      {error && (
        <div
          role="alert"
          className="mx-1 flex items-center justify-between gap-2 rounded-md border border-destructive/25 bg-destructive/5 px-2.5 py-2 text-[11px] text-muted-foreground"
        >
          <span className="min-w-0">{error}</span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onRetry}
            className="h-6 shrink-0 px-2 text-[10px]"
          >
            Retry
          </Button>
        </div>
      )}

      {loading ? (
        <InboxSkeleton />
      ) : notifications.length > 0 ? (
        <div className="space-y-1.5 px-1">
          {notifications.map((notification) => (
            <NotificationCard
              key={notification.id}
              notification={notification}
              onToggleRead={onToggleRead}
              onToggleArchived={onToggleArchived}
            />
          ))}
          {hasMore && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={loadingMore}
              onClick={onLoadMore}
              className="h-8 w-full text-[11px]"
            >
              {loadingMore
                ? "Loading older notifications…"
                : "Load older notifications"}
            </Button>
          )}
        </div>
      ) : (
        <div className="flex min-h-48 flex-col items-center justify-center gap-2 px-5 py-8 text-center">
          <div className="grid size-10 place-items-center rounded-xl border bg-muted/40 text-muted-foreground">
            {filter === "priority" ? (
              <Bell className="size-4" />
            ) : filter === "archived" ? (
              <Archive className="size-4" />
            ) : (
              <Inbox className="size-4" />
            )}
          </div>
          <p className="text-xs font-medium">
            {filter === "unread"
              ? "You’re all caught up"
              : filter === "priority"
                ? "No priority notifications"
                : filter === "archived"
                  ? "Nothing archived"
                  : "Your inbox is clear"}
          </p>
          <p className="max-w-56 text-[11px] leading-relaxed text-muted-foreground">
            {filter === "archived"
              ? "Archived items stay here until you restore them."
              : "Updates from enabled tools and workspace services will appear here."}
          </p>
        </div>
      )}

      {hasMore && notifications.length === 0 && !loading && (
        <div className="px-1">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={loadingMore}
            onClick={onLoadMore}
            className="h-8 w-full text-[11px]"
          >
            {loadingMore
              ? "Loading older notifications…"
              : "Load older notifications"}
          </Button>
        </div>
      )}

      {filter !== "archived" && notifications.length > 0 && unreadCount > 0 && (
        <div className="px-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onMarkAllRead}
            className="h-7 w-full gap-1.5 text-[10px] text-muted-foreground"
          >
            <CheckCheck className="size-3.5" /> Mark all as read
          </Button>
        </div>
      )}
    </div>
  )
}

function NotificationCard({
  notification,
  onToggleRead,
  onToggleArchived,
}: {
  notification: InboxNotification
  onToggleRead: (notification: InboxNotification) => void
  onToggleArchived: (notification: InboxNotification) => void
}) {
  const unread = notification.readAt === null
  const domain = notification.sourceDomainId
    ? getDomain(notification.sourceDomainId)
    : undefined
  const tool =
    notification.sourceDomainId && notification.sourceToolId
      ? getTool(notification.sourceDomainId, notification.sourceToolId)
      : undefined
  const source = tool
    ? `${domain?.name ?? notification.sourceDomainId} · ${tool.name}`
    : (domain?.name ?? "Orbit")
  const timestamp = new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(notification.createdAt))
  const content = (
    <>
      <div className="flex min-w-0 items-start gap-1.5">
        {unread && (
          <Circle
            aria-label="Unread"
            className="mt-1 size-2 shrink-0 fill-primary text-primary"
          />
        )}
        <span className="min-w-0 flex-1 text-[11px] leading-snug font-medium text-foreground">
          {notification.title}
        </span>
        {notification.priority && (
          <span className="inline-flex shrink-0 items-center gap-1 rounded border border-amber-500/30 bg-amber-500/10 px-1.5 py-0.5 text-[9px] font-medium text-amber-700 dark:text-amber-300">
            <ShieldAlert className="size-2.5" /> Priority
          </span>
        )}
      </div>
      {notification.body && (
        <p className="mt-1 line-clamp-3 text-[11px] leading-relaxed text-muted-foreground">
          {notification.body}
        </p>
      )}
      <div className="mt-2 flex items-center justify-between gap-2 text-[9px] text-muted-foreground">
        <span className="min-w-0 truncate">{source}</span>
        <time className="shrink-0" dateTime={notification.createdAt}>
          {timestamp}
        </time>
      </div>
    </>
  )

  return (
    <article
      className={`group rounded-lg border p-2.5 transition-colors ${unread ? "border-primary/20 bg-primary/[0.035]" : "bg-card/50 hover:bg-muted/40"}`}
    >
      {notification.href ? (
        <Link
          to={notification.href}
          onClick={() => {
            if (unread) onToggleRead(notification)
          }}
          className="block rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label={`Open notification: ${notification.title}`}
        >
          {content}
        </Link>
      ) : (
        <div>{content}</div>
      )}
      <div className="mt-2 flex items-center justify-end gap-1 border-t border-border/60 pt-1.5">
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          aria-label={unread ? "Mark as read" : "Mark as unread"}
          title={unread ? "Mark as read" : "Mark as unread"}
          onClick={() => onToggleRead(notification)}
          className="size-6 text-muted-foreground"
        >
          {unread ? (
            <MailOpen className="size-3.5" />
          ) : (
            <Mail className="size-3.5" />
          )}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          aria-label={
            notification.archivedAt
              ? "Restore to inbox"
              : "Archive notification"
          }
          title={
            notification.archivedAt
              ? "Restore to inbox"
              : "Archive notification"
          }
          onClick={() => onToggleArchived(notification)}
          className="size-6 text-muted-foreground"
        >
          {notification.archivedAt ? (
            <ArchiveRestore className="size-3.5" />
          ) : (
            <Archive className="size-3.5" />
          )}
        </Button>
      </div>
    </article>
  )
}

function InboxSkeleton() {
  return (
    <div aria-label="Loading notifications" className="space-y-2 px-1">
      {[0, 1, 2].map((item) => (
        <div
          key={item}
          className="animate-pulse rounded-lg border bg-card/50 p-3"
        >
          <div className="flex items-center gap-2">
            <div className="size-2 rounded-full bg-muted" />
            <div className="h-3 w-3/5 rounded bg-muted" />
          </div>
          <div className="mt-2 h-2.5 w-full rounded bg-muted/80" />
          <div className="mt-1.5 h-2.5 w-4/5 rounded bg-muted/80" />
          <div className="mt-3 flex justify-between">
            <div className="h-2 w-1/3 rounded bg-muted" />
            <div className="h-2 w-1/4 rounded bg-muted" />
          </div>
        </div>
      ))}
    </div>
  )
}
