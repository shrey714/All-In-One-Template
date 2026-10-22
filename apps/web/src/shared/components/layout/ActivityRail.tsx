import { Link } from "react-router-dom"
import {
  Clock3,
  Command,
  FolderTree,
  HelpCircle,
  Moon,
  Settings2,
  Star,
  Sun,
} from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import { useTheme } from "@/app/providers"
import type { SidebarView } from "@/shared/types/workspace"

export type { SidebarView } from "@/shared/types/workspace"
type Props = {
  view: SidebarView
  onViewChange: (view: SidebarView) => void
  onSettings: () => void
  onHelp: () => void
  sidebarVisible: boolean
}

const views = [
  { id: "explorer", label: "Explorer", icon: FolderTree },
  { id: "pinned", label: "Pinned tools", icon: Star },
  { id: "recent", label: "Recent tools", icon: Clock3 },
] as const

export function ActivityRail({
  view,
  onViewChange,
  onSettings,
  onHelp,
  sidebarVisible
}: Props) {
  const { theme, setTheme } = useTheme()
  const ThemeIcon = theme === "dark" ? Sun : Moon

  return (
    <nav
      aria-label="Workspace views"
      className={`flex h-full w-12 shrink-0 flex-col items-center overflow-hidden py-3 ${sidebarVisible ? 'mr-1' : ''}`}
    >
      <Link
        aria-label="Go to dashboard"
        title="Dashboard"
        to="/"
        className={`mb-5 grid size-9 place-items-center rounded-xl transition-colors bg-primary text-primary-foreground shadow-sm`}
        onClick={() => onViewChange("explorer")}
      >
        <Command className="size-4" />
      </Link>
      <div className="flex flex-col items-center gap-1.5">
        {views.map(({ id, label, icon: Icon }) => (
          <Button
            key={id}
            variant="ghost"
            size="icon"
            title={label}
            aria-label={label}
            aria-pressed={view === id}
            onClick={() => onViewChange(id)}
            className={
              view === id
                ? "bg-primary/10 text-primary hover:bg-primary/15 hover:text-primary"
                : "text-muted-foreground"
            }
          >
            <Icon className="size-4" />
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
        <span
          className="mt-1 grid size-7 place-items-center rounded-full bg-violet-100 text-[10px] font-bold text-violet-800 dark:bg-violet-950 dark:text-violet-200"
          title="Pakhi Srivastava"
          aria-label="Profile: Pakhi Srivastava"
        >
          PS
        </span>
      </div>
    </nav>
  )
}
