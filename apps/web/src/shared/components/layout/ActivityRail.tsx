import { Link } from "react-router-dom"
import {
  Clock3,
  Command,
  FolderTree,
  HelpCircle,
  Inbox,
  Moon,
  Pin,
  Settings2,
  Sun,
} from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import { useTheme } from "@/app/providers"
import { useAuth } from "@/app/providers/AuthProvider"
import { AccountMenu } from "@/shared/components/layout/AccountMenu"
import { orbitConfig } from "@/shared/config/orbit-config"
import type { SidebarView } from "@/shared/types/workspace"

export type { SidebarView } from "@/shared/types/workspace"
type Props = {
  view: SidebarView
  onViewChange: (view: SidebarView) => void
  onSettings: () => void
  onHelp: () => void
  sidebarVisible: boolean
  unreadCount: number
}

const views = [
  { id: "explorer", label: "Explorer", icon: FolderTree },
  { id: "pinned", label: "Pinned tools", icon: Pin },
  { id: "recent", label: "Recent tools", icon: Clock3 },
  { id: "inbox", label: "Inbox", icon: Inbox },
] as const

export function ActivityRail({
  view,
  onViewChange,
  onSettings,
  onHelp,
  sidebarVisible,
  unreadCount,
}: Props) {
  const { theme, setTheme } = useTheme()
  const { authEnabled, user } = useAuth()
  const inboxAvailable =
    orbitConfig.notifications.enabled &&
    authEnabled &&
    Boolean(user && !user.mustChangePassword)
  const ThemeIcon = theme === "dark" ? Sun : Moon

  return (
    <nav
      aria-label="Workspace views"
      className={`flex h-full w-12 shrink-0 flex-col items-center overflow-hidden py-3 ${sidebarVisible ? "mr-1" : ""}`}
    >
      <Link
        aria-label="Go to dashboard"
        title="Dashboard"
        to="/"
        className={`mb-5 grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground shadow-sm transition-colors`}
        onClick={() => onViewChange("explorer")}
      >
        <Command className="size-4" />
      </Link>
      <div className="flex flex-col items-center gap-1.5">
        {views
          .filter(({ id }) => id !== "inbox" || inboxAvailable)
          .map(({ id, label, icon: Icon }) => (
            <Button
              key={id}
              variant="ghost"
              size="icon"
              title={
                id === "inbox" && unreadCount > 0
                  ? `${label} · ${unreadCount} unread`
                  : label
              }
              aria-label={
                id === "inbox" && unreadCount > 0
                  ? `${label}, ${unreadCount} unread`
                  : label
              }
              aria-pressed={view === id}
              onClick={() => onViewChange(id)}
              className={`relative ${
                view === id
                  ? "bg-primary/10 text-primary hover:bg-primary/15 hover:text-primary"
                  : "text-muted-foreground"
              }`}
            >
              <Icon className="size-4" />
              {id === "inbox" && unreadCount > 0 && (
                <span
                  aria-hidden="true"
                  className="absolute -top-0.5 -right-0.5 grid min-h-3.5 min-w-3.5 place-items-center rounded-full bg-primary px-0.5 text-[8px] leading-none text-primary-foreground"
                >
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </Button>
          ))}
      </div>
      <span className="flex-1" />
      <div className="flex flex-col items-center gap-1 border-t border-border/70 pt-2">
        <Button
          variant="ghost"
          size="icon"
          title={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
          aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        >
          <ThemeIcon className="size-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          title="Keyboard shortcuts · ?"
          aria-label="Keyboard shortcuts"
          onClick={onHelp}
        >
          <HelpCircle className="size-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          title="Configuration manager · ⌘,"
          aria-label="Workspace settings"
          onClick={onSettings}
        >
          <Settings2 className="size-4" />
        </Button>
        <AccountMenu className="mt-1" />
      </div>
    </nav>
  )
}
