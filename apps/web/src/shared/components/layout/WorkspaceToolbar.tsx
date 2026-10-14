import { useLocation } from "react-router-dom"
import { Command, HelpCircle, Moon, Search, Settings2, Sun } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import { useTheme } from "@/app/providers"
import { getTool, getDomain } from "@/shared/config/registry"

type Props = {
  onSearch: () => void
  onSettings: () => void
  onHelp: () => void
}
export function WorkspaceToolbar({ onSearch, onSettings, onHelp }: Props) {
  const location = useLocation()
  const { theme, setTheme } = useTheme()
  const parts = location.pathname.split("/").filter(Boolean)
  const domain = parts[0] === "domains" ? getDomain(parts[1] ?? "") : undefined
  const toolIndex = parts.indexOf("tools")
  const tool =
    toolIndex >= 0
      ? getTool(parts[1] ?? "", parts[toolIndex + 1] ?? "")
      : undefined
  const crumb =
    tool?.name ??
    domain?.name ??
    (parts[0] === "not-found" ? "Not found" : "Overview")
  const ThemeIcon = theme === "dark" ? Sun : Moon
  return (
    <header className="flex h-[54px] shrink-0 items-center justify-between gap-2 border-b border-border px-3 sm:gap-3 sm:px-5">
      <div className="flex min-w-0 shrink items-center gap-2 text-xs">
        <span className="hidden text-muted-foreground sm:inline">Orbit</span>
        <span className="hidden text-muted-foreground/50 sm:inline">/</span>
        <span className="truncate font-medium">{crumb}</span>
        <span className="hidden rounded border px-1.5 py-0.5 text-[9px] tracking-wider text-muted-foreground uppercase xl:inline">
          Workspace
        </span>
      </div>
      <div className="flex min-w-0 flex-1 justify-center">
        <Button
          variant="outline"
          aria-label="Search tools, pages, and commands"
          className="h-8 w-full max-w-[460px] min-w-0 justify-start gap-2 rounded-lg bg-background px-2.5 text-xs font-normal text-muted-foreground shadow-none"
          onClick={onSearch}
        >
          <Search className="size-3.5 shrink-0" />
          <span className="min-w-0 flex-1 truncate text-left">
            Search tools, pages, and commands…
          </span>
          <kbd className="hidden shrink-0 items-center gap-1 rounded border bg-muted/50 px-1.5 py-0.5 text-[10px] sm:flex">
            <Command className="size-2.5" />K
          </kbd>
        </Button>
      </div>
      <div className="flex shrink-0 items-center gap-0.5">
        <Button
          variant="ghost"
          size="icon-sm"
          title="Toggle light/dark theme"
          aria-label="Toggle theme"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        >
          <ThemeIcon className="size-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          title="Keyboard shortcuts · ?"
          aria-label="Keyboard shortcuts"
          onClick={onHelp}
        >
          <HelpCircle className="size-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          title="Configuration manager · ⌘,"
          aria-label="Workspace settings"
          onClick={onSettings}
        >
          <Settings2 className="size-4" />
        </Button>
        <span className="ml-1 grid size-7 shrink-0 place-items-center rounded-full bg-violet-100 text-[10px] font-bold text-violet-800 dark:bg-violet-950 dark:text-violet-200">
          PS
        </span>
      </div>
    </header>
  )
}
