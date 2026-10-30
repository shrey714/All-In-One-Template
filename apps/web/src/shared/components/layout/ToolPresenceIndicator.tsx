import { UsersRound } from "lucide-react"
import {
  Avatar,
  AvatarFallback,
  AvatarGroup,
  AvatarGroupCount,
} from "@workspace/ui/components/avatar"
import { Button } from "@workspace/ui/components/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@workspace/ui/components/popover"
import { useToolPresence } from "@/shared/hooks/useToolPresence"

export function ToolPresenceIndicator({
  enabled,
  userId,
  domainId,
  toolId,
}: {
  enabled: boolean
  userId: number
  domainId: string
  toolId: string
}) {
  const { users, available, loading, tabLimitReached } = useToolPresence({
    enabled,
    userId,
    domainId,
    toolId,
  })
  if (!enabled) return null

  const label =
    available === false
      ? tabLimitReached
        ? "Active tab limit reached"
        : "Active users unavailable"
      : loading
        ? "Checking active users"
        : `${users.length} active ${users.length === 1 ? "user" : "users"}`
  const currentUser = users.find((user) => user.isYou)
  const previewUsers =
    available === false
      ? []
      : [
          ...(currentUser ? [currentUser] : []),
          ...users.filter((user) => !user.isYou),
        ].slice(0, 3)
  const remainingCount = Math.max(0, users.length - previewUsers.length)

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 shrink-0 gap-1.5 rounded-sm px-2 text-[11px] text-muted-foreground"
          aria-label={`${label} in this tool`}
          title={`${label} in this tool`}
        >
          <span
            className={`size-1.5 shrink-0 rounded-full ${available === true ? "bg-emerald-500" : "bg-muted-foreground/50"}`}
            aria-hidden="true"
          />
          {previewUsers.length > 0 ? (
            <AvatarGroup className="pl-2" aria-hidden="true">
              {previewUsers.map((user, index) => (
                <Avatar
                  key={`${user.displayName}-${index}`}
                  size="sm"
                  className={`group/active-user transition-[z-index] hover:z-50 ${avatarStack(index)}`}
                >
                  <AvatarFallback
                    className={`text-[9px] font-semibold ${avatarTone(user)}`}
                  >
                    {initials(user.displayName)}
                  </AvatarFallback>
                  <span
                    role="tooltip"
                    className="pointer-events-none absolute top-full left-1/2 z-[100] mt-2 w-max -translate-x-1/2 rounded-md border bg-popover px-2.5 py-1.5 text-left text-popover-foreground opacity-0 shadow-md transition-opacity duration-100 group-hover/active-user:opacity-100"
                  >
                    <span className="block text-xs font-medium">
                      {user.displayName}
                    </span>
                    <span className="mt-0.5 block text-[10px] text-muted-foreground">
                      {user.isYou ? "You · active now" : "Active in this tool"}
                    </span>
                  </span>
                </Avatar>
              ))}
              {remainingCount > 0 ? (
                <AvatarGroupCount className="relative z-40 text-[9px] font-semibold">
                  +{remainingCount}
                </AvatarGroupCount>
              ) : null}
            </AvatarGroup>
          ) : (
            <span className="flex items-center gap-1 text-[11px]">
              <UsersRound className="size-3.5" aria-hidden="true" />
              {loading ? "…" : available === false ? null : "0"}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" side="bottom" className="w-64 p-0">
        <div className="border-b px-3 py-2.5">
          <p className="text-sm font-medium">Active in this tool</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Visible teammates refresh every 20 seconds.
          </p>
        </div>
        {available === false ? (
          <p className="px-3 py-4 text-sm text-muted-foreground">
            {tabLimitReached
              ? "This account has reached the active-tab presence limit. Close another Orbit tab; this view retries automatically."
              : "Presence is temporarily unavailable. You can keep using the tool."}
          </p>
        ) : users.length === 0 ? (
          <p className="px-3 py-4 text-sm text-muted-foreground">
            No active users found.
          </p>
        ) : (
          <ul className="max-h-64 overflow-auto p-1.5">
            {users.map((user, index) => (
              <li
                key={`${user.displayName}-${index}`}
                className="flex items-center gap-2.5 rounded-sm px-2 py-2"
              >
                <Avatar size="sm">
                  <AvatarFallback
                    className={`text-[10px] font-medium ${avatarTone(user)}`}
                  >
                    {initials(user.displayName)}
                  </AvatarFallback>
                </Avatar>
                <span className="min-w-0 flex-1 truncate text-sm">
                  {user.displayName}
                </span>
                {user.isYou ? (
                  <span className="text-[10px] text-muted-foreground">You</span>
                ) : null}
                <span
                  className="size-1.5 rounded-full bg-emerald-500"
                  aria-label="Active"
                />
              </li>
            ))}
          </ul>
        )}
        <div className="border-t px-3 py-2 text-[10px] text-muted-foreground">
          Inactive tabs expire automatically.
        </div>
      </PopoverContent>
    </Popover>
  )
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  const value =
    parts.length > 1
      ? `${parts[0]?.[0] ?? ""}${parts.at(-1)?.[0] ?? ""}`
      : (parts[0]?.slice(0, 2) ?? "?")
  return value.toLocaleUpperCase()
}

function avatarTone(user: { displayName: string; isYou: boolean }) {
  if (user.isYou) return "bg-primary text-primary-foreground"
  const palette = [
    "bg-blue-700 text-white",
    "bg-violet-700 text-white",
    "bg-emerald-700 text-white",
    "bg-rose-700 text-white",
    "bg-amber-800 text-white",
  ]
  let hash = 0
  for (const character of user.displayName) {
    hash = (hash * 31 + character.codePointAt(0)!) | 0
  }
  return palette[Math.abs(hash) % palette.length]!
}

function avatarStack(index: number) {
  return index === 0 ? "z-30" : index === 1 ? "z-20" : "z-10"
}
