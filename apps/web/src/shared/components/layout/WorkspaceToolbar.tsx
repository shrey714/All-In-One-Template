import { useState, type ReactNode } from "react"
import { useLocation, useNavigate, useNavigationType } from "react-router-dom"
import {
  ArrowLeft,
  ArrowRight,
  Command,
  PanelBottomClose,
  PanelBottomOpen,
  PanelLeftClose,
  PanelLeftOpen,
  PanelRightClose,
  PanelRightOpen,
  Search,
} from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import { getTool, getDomain } from "@/shared/config/registry"

type Props = {
  onSearch: () => void
  onToggleSidebar: () => void
  sidebarCollapsed: boolean
  rightPanelAvailable: boolean
  rightPanelOpen: boolean
  onToggleRightPanel: () => void
  bottomPanelAvailable: boolean
  bottomPanelOpen: boolean
  onToggleBottomPanel: () => void
}
export function WorkspaceToolbar({
  onSearch,
  onToggleSidebar,
  sidebarCollapsed,
  rightPanelAvailable,
  rightPanelOpen,
  onToggleRightPanel,
  bottomPanelAvailable,
  bottomPanelOpen,
  onToggleBottomPanel,
}: Props) {
  const location = useLocation()
  const navigate = useNavigate()
  const navigationType = useNavigationType()
  const route = `${location.pathname}${location.search}${location.hash}`
  const [history, setHistory] = useState(() => ({
    entries: [{ key: location.key, route }],
    index: 0,
    currentKey: location.key,
  }))

  let currentHistory = history
  if (history.currentKey !== location.key) {
    const entry = { key: location.key, route }
    let entries = history.entries
    let index = history.index

    if (navigationType === "POP") {
      const previousIndex = entries.findIndex((item) => item.key === entry.key)
      if (previousIndex >= 0) {
        index = previousIndex
      } else {
        entries = [...entries.slice(0, index + 1), entry]
        index = entries.length - 1
      }
    } else if (navigationType === "PUSH") {
      entries = [...entries.slice(0, index + 1), entry]
      index = entries.length - 1
    } else {
      entries = [...entries]
      entries[index] = entry
    }

    currentHistory = { entries, index, currentKey: entry.key }
    setHistory(currentHistory)
  }

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
  return (
    <header className="grid shrink-0 grid-cols-[minmax(0,1fr)_minmax(0,min(460px,calc(100vw-160px)))_minmax(0,1fr)] items-center gap-2 px-3 py-1 sm:pl-5">
      <div className="hidden min-w-0 items-center gap-2 text-xs lg:flex">
        <span className="text-muted-foreground">Orbit</span>
        <span className="text-muted-foreground/50">/</span>
        <span className="truncate font-medium">{crumb}</span>
        <span className="hidden rounded border px-1.5 py-0.5 text-[9px] tracking-wider text-muted-foreground uppercase xl:inline">
          Workspace
        </span>
      </div>
      <div className="relative col-start-2 w-full min-w-0">
        <div className="absolute top-1/2 right-full mr-1 flex -translate-y-1/2 items-center">
          <Button
            variant="ghost"
            size="icon-sm"
            className="size-8 rounded-sm"
            aria-label="Go back"
            title="Go back"
            disabled={currentHistory.index <= 0}
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            className="size-8 rounded-sm"
            aria-label="Go forward"
            title="Go forward"
            disabled={currentHistory.index >= currentHistory.entries.length - 1}
            onClick={() => navigate(1)}
          >
            <ArrowRight className="size-4" />
          </Button>
        </div>
        <Button
          variant="outline"
          aria-label="Search tools, pages, and commands"
          className="h-8 w-full min-w-0 justify-start gap-2 rounded-sm bg-background px-2.5 text-xs font-normal text-muted-foreground shadow-none"
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
      <div className="justify-self-end">
        <div className="flex items-center">
          <ToolbarControlSlot
            visible
            afterVisible={rightPanelAvailable || bottomPanelAvailable}
          >
            <Button
              variant="ghost"
              size="icon-sm"
              className="size-7 rounded-sm"
              aria-label={
                sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"
              }
              title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              aria-pressed={!sidebarCollapsed}
              onClick={onToggleSidebar}
            >
              {sidebarCollapsed ? (
                <PanelLeftOpen className="size-4" />
              ) : (
                <PanelLeftClose className="size-4" />
              )}
            </Button>
          </ToolbarControlSlot>
          <ToolbarControlSlot
            visible={rightPanelAvailable}
            afterVisible={bottomPanelAvailable}
          >
            <Button
              variant="ghost"
              size="icon-sm"
              className="size-7 rounded-sm"
              aria-label={
                rightPanelOpen ? "Close right panel" : "Open right panel"
              }
              title={rightPanelOpen ? "Close right panel" : "Open right panel"}
              aria-pressed={rightPanelOpen}
              onClick={onToggleRightPanel}
              disabled={!rightPanelAvailable}
            >
              {rightPanelOpen ? (
                <PanelRightClose className="size-4" />
              ) : (
                <PanelRightOpen className="size-4" />
              )}
            </Button>
          </ToolbarControlSlot>
          <ToolbarControlSlot visible={bottomPanelAvailable}>
            <Button
              variant="ghost"
              size="icon-sm"
              className="size-7 rounded-sm"
              aria-label={
                bottomPanelOpen ? "Close bottom panel" : "Open bottom panel"
              }
              title={
                bottomPanelOpen ? "Close bottom panel" : "Open bottom panel"
              }
              aria-pressed={bottomPanelOpen}
              onClick={onToggleBottomPanel}
              disabled={!bottomPanelAvailable}
            >
              {bottomPanelOpen ? (
                <PanelBottomClose className="size-4" />
              ) : (
                <PanelBottomOpen className="size-4" />
              )}
            </Button>
          </ToolbarControlSlot>
        </div>
      </div>
    </header>
  )
}

function ToolbarControlSlot({
  visible,
  afterVisible = false,
  children,
}: {
  visible: boolean
  afterVisible?: boolean
  children: ReactNode
}) {
  return (
    <span
      aria-hidden={!visible}
      className={`grid shrink-0 origin-right place-items-center overflow-hidden transition-[width,margin,opacity,transform] duration-200 ease-out motion-reduce:transition-none ${visible ? "w-7 scale-100 opacity-100" : "pointer-events-none mr-0 w-0 scale-90 opacity-0"} ${visible && afterVisible ? "mr-0.5" : ""}`}
    >
      {children}
    </span>
  )
}
