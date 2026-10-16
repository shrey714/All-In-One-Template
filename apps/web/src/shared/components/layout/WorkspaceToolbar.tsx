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
  PanelsRightBottom,
  Search,
} from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
} from "@workspace/ui/components/popover"
import { getTool, getDomain } from "@/shared/config/registry"
import { CustomizeLayoutMenu } from "@/shared/components/layout/CustomizeLayoutMenu"
import { CommandSearchContent } from "@/shared/components/dialogs/CommandSearchContent"

type Props = {
  floatingPanel: "search" | "layout" | null
  onFloatingPanelChange: (panel: "search" | "layout" | null) => void
  onOpenSettings: () => void
  onToggleSidebar: () => void
  sidebarVisible: boolean
  sidebarCollapsed: boolean
  rightPanelAvailable: boolean
  rightPanelOpen: boolean
  onToggleRightPanel: () => void
  onRightPanelOpenChange: (open: boolean) => void
  bottomPanelAvailable: boolean
  bottomPanelOpen: boolean
  onToggleBottomPanel: () => void
  onBottomPanelOpenChange: (open: boolean) => void
  activityRailVisible: boolean
  onActivityRailVisibleChange: (visible: boolean) => void
  onSidebarVisibleChange: (visible: boolean) => void
  showStatusBar: boolean
  onShowStatusBarChange: (visible: boolean) => void
  centeredContent: boolean
  onCenteredContentChange: (centered: boolean) => void
  onFocusMode: () => void
  onShowAllPanels: () => void
  onResetLayout: () => void
}
export function WorkspaceToolbar({
  floatingPanel,
  onFloatingPanelChange,
  onOpenSettings,
  onToggleSidebar,
  sidebarVisible,
  sidebarCollapsed,
  rightPanelAvailable,
  rightPanelOpen,
  onToggleRightPanel,
  onRightPanelOpenChange,
  bottomPanelAvailable,
  bottomPanelOpen,
  onToggleBottomPanel,
  onBottomPanelOpenChange,
  activityRailVisible,
  onActivityRailVisibleChange,
  onSidebarVisibleChange,
  showStatusBar,
  onShowStatusBarChange,
  centeredContent,
  onCenteredContentChange,
  onFocusMode,
  onShowAllPanels,
  onResetLayout,
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
  const toggleFloatingPanel = (panel: "search" | "layout") => {
    onFloatingPanelChange(floatingPanel === panel ? null : panel)
  }
  const closeFloatingPanel = () => onFloatingPanelChange(null)

  return (
    <Popover
      open={floatingPanel !== null}
      onOpenChange={(open) => {
        if (!open) closeFloatingPanel()
      }}
    >
      <>
        <header className="grid shrink-0 grid-cols-[minmax(0,1fr)_minmax(0,min(460px,calc(100vw-160px)))_minmax(0,1fr)] items-center gap-2 px-3 pb-1 sm:pl-5">
          <div className="hidden min-w-0 items-center gap-2 text-xs lg:flex">
            <span className="text-muted-foreground">Orbit</span>
            <span className="text-muted-foreground/50">/</span>
            <span className="truncate font-medium">{crumb}</span>
            <span className="hidden rounded border px-1.5 py-0.5 text-[9px] tracking-wider text-muted-foreground uppercase xl:inline">
              Workspace
            </span>
          </div>
          <PopoverAnchor asChild>
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
                  disabled={
                    currentHistory.index >= currentHistory.entries.length - 1
                  }
                  onClick={() => navigate(1)}
                >
                  <ArrowRight className="size-4" />
                </Button>
              </div>
              <Button
                variant="outline"
                aria-label="Search tools, pages, and commands"
                aria-haspopup="dialog"
                aria-expanded={floatingPanel === "search"}
                className="h-8 w-full min-w-0 justify-start gap-2 rounded-sm bg-background px-2.5 text-xs font-normal text-muted-foreground shadow-none"
                onClick={() => toggleFloatingPanel("search")}
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
          </PopoverAnchor>
          <div className="justify-self-end">
            <div className="flex items-center">
              <Button
                variant="ghost"
                size="icon-sm"
                className="size-7 rounded-sm"
                aria-label="Customize Layout"
                title="Customize Layout"
                aria-haspopup="dialog"
                aria-expanded={floatingPanel === "layout"}
                onClick={() => toggleFloatingPanel("layout")}
              >
                <PanelsRightBottom className="size-4" />
              </Button>
              <ToolbarControlSlot
                visible
                afterVisible={rightPanelAvailable || bottomPanelAvailable}
              >
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="size-7 rounded-sm"
                  aria-label={
                    !sidebarVisible
                      ? "Show sidebar"
                      : sidebarCollapsed
                        ? "Expand sidebar"
                        : "Collapse sidebar"
                  }
                  title={
                    !sidebarVisible
                      ? "Show sidebar"
                      : sidebarCollapsed
                        ? "Expand sidebar"
                        : "Collapse sidebar"
                  }
                  aria-pressed={sidebarVisible && !sidebarCollapsed}
                  onClick={onToggleSidebar}
                >
                  {!sidebarVisible || sidebarCollapsed ? (
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
                  title={
                    rightPanelOpen ? "Close right panel" : "Open right panel"
                  }
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
        {floatingPanel && (
          <PopoverContent
            align="center"
            side="bottom"
            sideOffset={-32}
            className="w-[min(460px,calc(100vw-160px))] max-w-[calc(100vw-1rem)] gap-0 rounded-sm p-0"
          >
            {floatingPanel === "search" ? (
              <CommandSearchContent
                onClose={closeFloatingPanel}
                onOpenSettings={onOpenSettings}
              />
            ) : (
              <CustomizeLayoutMenu
                activityRailVisible={activityRailVisible}
                onActivityRailVisibleChange={onActivityRailVisibleChange}
                sidebarVisible={sidebarVisible}
                onSidebarVisibleChange={onSidebarVisibleChange}
                rightPanelAvailable={rightPanelAvailable}
                rightPanelOpen={rightPanelOpen}
                onRightPanelChange={onRightPanelOpenChange}
                bottomPanelAvailable={bottomPanelAvailable}
                bottomPanelOpen={bottomPanelOpen}
                onBottomPanelChange={onBottomPanelOpenChange}
                statusBarVisible={showStatusBar}
                onStatusBarVisibleChange={onShowStatusBarChange}
                centeredContent={centeredContent}
                onCenteredContentChange={onCenteredContentChange}
                onFocusMode={onFocusMode}
                onShowAll={onShowAllPanels}
                onResetLayout={onResetLayout}
                onClose={closeFloatingPanel}
              />
            )}
          </PopoverContent>
        )}
      </>
    </Popover>
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
