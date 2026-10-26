import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent,
} from "react"
import { Outlet, useLocation } from "react-router-dom"
import type { SidebarView } from "@/shared/types/workspace"
import { SidebarResizeHandle } from "@/shared/components/layout/SidebarResizeHandle"
import { WorkspaceSidebar } from "@/shared/components/layout/WorkspaceSidebar"
import { ToolDock } from "@/shared/components/layout/ToolDock"
import { WorkspaceStatusBar } from "@/shared/components/layout/WorkspaceStatusBar"
import { WorkspaceToolbar } from "@/shared/components/layout/WorkspaceToolbar"
import { ConfigManagerDialog } from "@/shared/components/dialogs/ConfigManagerDialog"
import { ShortcutHelpDialog } from "@/shared/components/dialogs/ShortcutHelpDialog"
import { appConfig } from "@/shared/config/app-config"
import { getTool } from "@/shared/config/registry"
import { usePersistentState } from "@/shared/hooks/usePersistentState"
import { useWorkspaceShortcuts } from "@/shared/hooks/useWorkspaceShortcuts"
import { recordRecentTool } from "@/shared/services/recent-tools"

export function AppShell() {
  const location = useLocation()
  const [sidebarWidth, setSidebarWidth] = usePersistentState<number>(
    `${appConfig.storageNamespace}.sidebar-width`,
    appConfig.defaultSidebarWidth
  )
  const [sidebarCollapsed, setSidebarCollapsed] = usePersistentState(
    `${appConfig.storageNamespace}.sidebar-collapsed`,
    false
  )
  const [activityRailVisible, setActivityRailVisible] = usePersistentState(
    `${appConfig.storageNamespace}.activity-rail-visible`,
    true
  )
  const [sidebarVisible, setSidebarVisible] = usePersistentState(
    `${appConfig.storageNamespace}.sidebar-visible`,
    true
  )
  const [rightPanelOpen, setRightPanelOpen] = usePersistentState(
    `${appConfig.storageNamespace}.right-panel-open`,
    false
  )
  const [bottomPanelOpen, setBottomPanelOpen] = usePersistentState(
    `${appConfig.storageNamespace}.bottom-panel-open`,
    false
  )
  const [rightPanelWidth, setRightPanelWidth] = usePersistentState<number>(
    `${appConfig.storageNamespace}.right-panel-width`,
    appConfig.defaultRightPanelWidth
  )
  const [bottomPanelHeight, setBottomPanelHeight] = usePersistentState<number>(
    `${appConfig.storageNamespace}.bottom-panel-height`,
    appConfig.defaultBottomPanelHeight
  )
  const [sidebarView, setSidebarView] = usePersistentState<SidebarView>(
    `${appConfig.storageNamespace}.sidebar-view`,
    "explorer"
  )
  const [compact, setCompact] = usePersistentState(
    `${appConfig.storageNamespace}.compact`,
    false
  )
  const [showStatusBar, setShowStatusBar] = usePersistentState(
    `${appConfig.storageNamespace}.status-bar`,
    true
  )
  const [centeredContent, setCenteredContent] = usePersistentState(
    `${appConfig.storageNamespace}.centered-content`,
    true
  )
  const [centerDotPattern, setCenterDotPattern] = usePersistentState(
    `${appConfig.storageNamespace}.dot-pattern.center`,
    true
  )
  const [rightDotPattern, setRightDotPattern] = usePersistentState(
    `${appConfig.storageNamespace}.dot-pattern.right`,
    false
  )
  const [bottomDotPattern, setBottomDotPattern] = usePersistentState(
    `${appConfig.storageNamespace}.dot-pattern.bottom`,
    false
  )
  const [toolbarPopup, setToolbarPopup] = useState<"search" | "layout" | null>(
    null
  )
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [settingsSession, setSettingsSession] = useState(0)
  const [shortcutsOpen, setShortcutsOpen] = useState(false)
  const drag = useRef<{ startX: number; startWidth: number } | null>(null)
  const dockDrag = useRef<{
    axis: "x" | "y"
    start: number
    size: number
  } | null>(null)
  const routeParts = location.pathname.split("/").filter(Boolean)
  const currentTool =
    routeParts[0] === "domains" && routeParts[2] === "tools"
      ? getTool(routeParts[1] ?? "", routeParts[3] ?? "")
      : undefined
  const openSearch = useCallback(() => setToolbarPopup("search"), [])
  const toggleSidebar = useCallback(
    () => setSidebarCollapsed((value) => !value),
    [setSidebarCollapsed]
  )
  const openSettings = useCallback(() => {
    setSettingsSession((session) => session + 1)
    setSettingsOpen(true)
  }, [])
  const openHelp = useCallback(() => setShortcutsOpen(true), [])
  const shortcutActions = useMemo(
    () => ({
      search: openSearch,
      toggleSidebar,
      settings: openSettings,
      help: openHelp,
    }),
    [openSearch, toggleSidebar, openSettings, openHelp]
  )
  useWorkspaceShortcuts(shortcutActions)

  useEffect(() => {
    const parts = location.pathname.split("/").filter(Boolean)
    const tool =
      parts[0] === "domains" && parts[2] === "tools"
        ? getTool(parts[1] ?? "", parts[3] ?? "")
        : undefined
    if (tool)
      recordRecentTool({
        domainId: parts[1] ?? "",
        toolId: tool.id,
        href: tool.href,
      })
  }, [location.pathname])

  useEffect(() => {
    const onSearch = () => setToolbarPopup("search")
    const onHelp = () => setShortcutsOpen(true)
    window.addEventListener("orbit:open-search", onSearch)
    window.addEventListener("orbit:open-shortcuts", onHelp)
    return () => {
      window.removeEventListener("orbit:open-search", onSearch)
      window.removeEventListener("orbit:open-shortcuts", onHelp)
    }
  }, [])

  const onResizeStart = (event: PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return
    event.preventDefault()
    drag.current = {
      startX: event.clientX,
      startWidth: sidebarCollapsed ? appConfig.minSidebarWidth : sidebarWidth,
    }
    if (sidebarCollapsed) setSidebarCollapsed(false)
    document.body.style.cursor = "col-resize"
    document.body.style.userSelect = "none"
  }

  useEffect(() => {
    const onMove = (event: globalThis.PointerEvent) => {
      if (!drag.current) return
      const next = Math.min(
        appConfig.maxSidebarWidth,
        Math.max(
          appConfig.minSidebarWidth,
          drag.current.startWidth + event.clientX - drag.current.startX
        )
      )
      setSidebarWidth(Math.round(next))
    }
    const onUp = () => {
      drag.current = null
      document.body.style.cursor = ""
      document.body.style.userSelect = ""
    }
    window.addEventListener("pointermove", onMove)
    window.addEventListener("pointerup", onUp)
    window.addEventListener("pointercancel", onUp)
    return () => {
      window.removeEventListener("pointermove", onMove)
      window.removeEventListener("pointerup", onUp)
      window.removeEventListener("pointercancel", onUp)
      onUp()
    }
  }, [setSidebarWidth])

  const onDockResizeStart = (
    axis: "x" | "y",
    size: number,
    event: PointerEvent<HTMLDivElement>
  ) => {
    if (event.button !== 0) return
    event.preventDefault()
    dockDrag.current = {
      axis,
      start: axis === "x" ? event.clientX : event.clientY,
      size,
    }
    document.body.style.cursor = axis === "x" ? "col-resize" : "row-resize"
    document.body.style.userSelect = "none"
  }

  useEffect(() => {
    const onMove = (event: globalThis.PointerEvent) => {
      const active = dockDrag.current
      if (!active) return
      const coordinate = active.axis === "x" ? event.clientX : event.clientY
      const delta = coordinate - active.start
      if (active.axis === "x") {
        setRightPanelWidth(
          Math.min(
            appConfig.maxRightPanelWidth,
            Math.max(appConfig.minRightPanelWidth, active.size - delta)
          )
        )
      } else {
        setBottomPanelHeight(
          Math.min(
            appConfig.maxBottomPanelHeight,
            Math.max(appConfig.minBottomPanelHeight, active.size - delta)
          )
        )
      }
    }
    const onUp = () => {
      dockDrag.current = null
      document.body.style.cursor = ""
      document.body.style.userSelect = ""
    }
    window.addEventListener("pointermove", onMove)
    window.addEventListener("pointerup", onUp)
    window.addEventListener("pointercancel", onUp)
    return () => {
      window.removeEventListener("pointermove", onMove)
      window.removeEventListener("pointerup", onUp)
      window.removeEventListener("pointercancel", onUp)
      onUp()
    }
  }, [setRightPanelWidth, setBottomPanelHeight])

  const resetLayout = () => {
    setSidebarWidth(appConfig.defaultSidebarWidth)
    setSidebarCollapsed(false)
    setActivityRailVisible(true)
    setSidebarVisible(true)
    setRightPanelOpen(false)
    setBottomPanelOpen(false)
    setRightPanelWidth(appConfig.defaultRightPanelWidth)
    setBottomPanelHeight(appConfig.defaultBottomPanelHeight)
    setSidebarView("explorer")
    setCompact(false)
    setShowStatusBar(true)
    setCenteredContent(true)
    setCenterDotPattern(true)
    setRightDotPattern(false)
    setBottomDotPattern(false)
  }
  const enableFocusMode = () => {
    setActivityRailVisible(false)
    setSidebarVisible(false)
    setRightPanelOpen(false)
    setBottomPanelOpen(false)
    setShowStatusBar(false)
  }
  const showAllPanels = () => {
    setActivityRailVisible(true)
    setSidebarVisible(true)
    setSidebarCollapsed(false)
    setRightPanelOpen(Boolean(currentTool?.panels?.right))
    setBottomPanelOpen(Boolean(currentTool?.panels?.bottom))
    setShowStatusBar(true)
  }
  const renderedWidth = sidebarCollapsed ? 60 : sidebarWidth
  const handleWidthChange = (width: number) => {
    setSidebarCollapsed(false)
    setSidebarWidth(width)
  }

  return (
    <div
      data-density={compact ? "compact" : "comfortable"}
      className="flex h-svh min-h-0 flex-col overflow-hidden p-1 text-foreground"
    >
      <WorkspaceToolbar
        floatingPanel={toolbarPopup}
        onFloatingPanelChange={setToolbarPopup}
        onOpenSettings={openSettings}
        showAccountMenu={!activityRailVisible}
        onToggleSidebar={() => {
          if (sidebarVisible) toggleSidebar()
          else setSidebarVisible(true)
        }}
        sidebarVisible={sidebarVisible}
        sidebarCollapsed={sidebarCollapsed}
        rightPanelAvailable={Boolean(currentTool?.panels?.right)}
        rightPanelOpen={rightPanelOpen}
        onToggleRightPanel={() => setRightPanelOpen((value) => !value)}
        onRightPanelOpenChange={setRightPanelOpen}
        bottomPanelAvailable={Boolean(currentTool?.panels?.bottom)}
        bottomPanelOpen={bottomPanelOpen}
        onToggleBottomPanel={() => setBottomPanelOpen((value) => !value)}
        onBottomPanelOpenChange={setBottomPanelOpen}
        activityRailVisible={activityRailVisible}
        onActivityRailVisibleChange={setActivityRailVisible}
        onSidebarVisibleChange={setSidebarVisible}
        showStatusBar={showStatusBar}
        onShowStatusBarChange={setShowStatusBar}
        centeredContent={centeredContent}
        onCenteredContentChange={setCenteredContent}
        centerDotPattern={centerDotPattern}
        onCenterDotPatternChange={setCenterDotPattern}
        rightDotPattern={rightDotPattern}
        onRightDotPatternChange={setRightDotPattern}
        bottomDotPattern={bottomDotPattern}
        onBottomDotPatternChange={setBottomDotPattern}
        onFocusMode={enableFocusMode}
        onShowAllPanels={showAllPanels}
        onResetLayout={resetLayout}
      />
      <div className="flex min-h-0 min-w-0 flex-1 overflow-hidden">
        {(activityRailVisible || sidebarVisible) && (
          <div className="hidden md:flex">
            <WorkspaceSidebar
              view={sidebarView}
              collapsed={sidebarCollapsed}
              onToggle={toggleSidebar}
              width={renderedWidth}
              activityRailVisible={activityRailVisible}
              sidebarVisible={sidebarVisible}
              onViewChange={setSidebarView}
              onSettings={openSettings}
              onHelp={openHelp}
            />
          </div>
        )}
        {sidebarVisible && !sidebarCollapsed ? (
          <div className="hidden md:flex">
            <SidebarResizeHandle
              panel="explorer"
              size={renderedWidth}
              min={appConfig.minSidebarWidth}
              max={appConfig.maxSidebarWidth}
              onToggle={toggleSidebar}
              onPointerDown={onResizeStart}
              onResize={handleWidthChange}
            />
          </div>
        ) : sidebarVisible || activityRailVisible ? (
          <span className="w-1"></span>
        ) : (
          <></>
        )}

        <div className="flex min-h-0 min-w-0 flex-1 overflow-hidden">
          <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
            <main
              id="workspace-main"
              className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-background md:rounded-md md:border md:border-border"
            >
              <div
                className={`workspace-content min-h-0 flex-1 overflow-auto ${compact ? "px-4 py-5 sm:px-5 lg:px-6" : "px-5 py-6 sm:px-6 lg:px-6"} ${centerDotPattern ? "orbit-dot-pattern" : ""}`}
              >
                <div
                  className={
                    centeredContent ? "mx-auto w-full max-w-[1280px]" : "w-full"
                  }
                >
                  <Outlet />
                </div>
              </div>
            </main>
            {currentTool?.panels?.bottom && (
              <>
                <SidebarResizeHandle
                  panel="bottom"
                  size={bottomPanelOpen ? bottomPanelHeight : 0}
                  min={bottomPanelOpen ? appConfig.minBottomPanelHeight : 0}
                  max={appConfig.maxBottomPanelHeight}
                  onResize={(size) => {
                    setBottomPanelOpen(true)
                    setBottomPanelHeight(
                      Math.min(
                        appConfig.maxBottomPanelHeight,
                        Math.max(appConfig.minBottomPanelHeight, size)
                      )
                    )
                  }}
                  onToggle={() => setBottomPanelOpen((value) => !value)}
                  onPointerDown={(event) => {
                    if (!bottomPanelOpen) setBottomPanelOpen(true)
                    onDockResizeStart(
                      "y",
                      bottomPanelOpen ? bottomPanelHeight : 0,
                      event
                    )
                  }}
                />
                {bottomPanelOpen && (
                  <div
                    className="flex min-h-0 min-w-0 shrink-0 flex-col overflow-hidden rounded-md border border-border"
                    style={{ height: bottomPanelHeight }}
                  >
                    <ToolDock
                      panel={currentTool.panels.bottom}
                      context={{
                        domainId: routeParts[1] ?? "",
                        toolId: currentTool.id,
                      }}
                      orientation="bottom"
                      onClose={() => setBottomPanelOpen(false)}
                      showDotPattern={bottomDotPattern}
                    />
                  </div>
                )}
              </>
            )}
          </div>
          {currentTool?.panels?.right && (
            <>
              <SidebarResizeHandle
                panel="right"
                size={rightPanelOpen ? rightPanelWidth : 0}
                min={rightPanelOpen ? appConfig.minRightPanelWidth : 0}
                max={appConfig.maxRightPanelWidth}
                onResize={(size) => {
                  setRightPanelOpen(true)
                  setRightPanelWidth(
                    Math.min(
                      appConfig.maxRightPanelWidth,
                      Math.max(appConfig.minRightPanelWidth, size)
                    )
                  )
                }}
                onToggle={() => setRightPanelOpen((value) => !value)}
                onPointerDown={(event) => {
                  if (!rightPanelOpen) setRightPanelOpen(true)
                  onDockResizeStart(
                    "x",
                    rightPanelOpen ? rightPanelWidth : 0,
                    event
                  )
                }}
              />
              {rightPanelOpen && (
                <div
                  className="flex min-h-0 min-w-0 shrink-0 overflow-hidden rounded-md border border-border"
                  style={{ width: rightPanelWidth }}
                >
                  <ToolDock
                    panel={currentTool.panels.right}
                    context={{
                      domainId: routeParts[1] ?? "",
                      toolId: currentTool.id,
                    }}
                    orientation="right"
                    onClose={() => setRightPanelOpen(false)}
                    showDotPattern={rightDotPattern}
                  />
                </div>
              )}
            </>
          )}
        </div>
      </div>
      {showStatusBar && <WorkspaceStatusBar onOpenSettings={openSettings} />}
      <ConfigManagerDialog
        key={settingsSession}
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        tool={currentTool}
        toolDomainId={routeParts[1]}
        compact={compact}
        onCompactChange={setCompact}
        showStatusBar={showStatusBar}
        onStatusBarChange={setShowStatusBar}
        activityRailVisible={activityRailVisible}
        onActivityRailVisibleChange={setActivityRailVisible}
        sidebarView={sidebarView}
        onSidebarViewChange={setSidebarView}
        sidebarVisible={sidebarVisible}
        onSidebarVisibleChange={setSidebarVisible}
        sidebarCollapsed={sidebarCollapsed}
        onSidebarCollapsedChange={setSidebarCollapsed}
        sidebarWidth={sidebarWidth}
        onSidebarWidthChange={setSidebarWidth}
        rightPanelAvailable={Boolean(currentTool?.panels?.right)}
        rightPanelOpen={rightPanelOpen}
        onRightPanelOpenChange={setRightPanelOpen}
        rightPanelWidth={rightPanelWidth}
        onRightPanelWidthChange={setRightPanelWidth}
        bottomPanelAvailable={Boolean(currentTool?.panels?.bottom)}
        bottomPanelOpen={bottomPanelOpen}
        onBottomPanelOpenChange={setBottomPanelOpen}
        bottomPanelHeight={bottomPanelHeight}
        onBottomPanelHeightChange={setBottomPanelHeight}
        centeredContent={centeredContent}
        onCenteredContentChange={setCenteredContent}
        centerDotPattern={centerDotPattern}
        onCenterDotPatternChange={setCenterDotPattern}
        rightDotPattern={rightDotPattern}
        onRightDotPatternChange={setRightDotPattern}
        bottomDotPattern={bottomDotPattern}
        onBottomDotPatternChange={setBottomDotPattern}
        onFocusMode={enableFocusMode}
        onShowAllPanels={showAllPanels}
        onResetLayout={resetLayout}
      />
      <ShortcutHelpDialog
        open={shortcutsOpen}
        onOpenChange={setShortcutsOpen}
      />
    </div>
  )
}
