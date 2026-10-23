import { useEffect, useLayoutEffect, useRef, useState } from "react"
import { NavLink } from "react-router-dom"
import {
  ChevronDown,
  ChevronsDown,
  ChevronsLeft,
  ChevronsRight,
  ChevronsUp,
  Clock3,
  FolderTree,
  Search,
  Star,
  Trash2,
  X,
} from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import {
  ActivityRail,
  type SidebarView,
} from "@/shared/components/layout/ActivityRail"
import { allTools, domains, getDomain, getTool } from "@/shared/config/registry"
import type { ToolDefinition } from "@/shared/types/tool"
import { ToolAvailabilityBadge } from "@/shared/components/tools/ToolAvailability"
import {
  togglePinnedTool,
  usePinnedTools,
} from "@/shared/services/pinned-tools"
import {
  clearRecentTools,
  useRecentTools,
} from "@/shared/services/recent-tools"

type WorkspaceTool = ToolDefinition & { domainId: string; domainName: string }
type Props = {
  view: SidebarView
  collapsed: boolean
  onToggle: () => void
  width: number
  activityRailVisible: boolean
  sidebarVisible: boolean
  onViewChange: (view: SidebarView) => void
  onSettings: () => void
  onHelp: () => void
}

function resolveStoredTools(
  records: { domainId: string; toolId: string }[]
): WorkspaceTool[] {
  return records.flatMap((record) => {
    const domain = getDomain(record.domainId)
    const tool = getTool(record.domainId, record.toolId)
    return domain && tool
      ? [{ ...tool, domainId: domain.id, domainName: domain.name }]
      : []
  })
}

function includesQuery(tool: WorkspaceTool, query: string) {
  return `${tool.name} ${tool.description} ${tool.domainName}`
    .toLowerCase()
    .includes(query)
}

export function WorkspaceSidebar({
  view,
  collapsed,
  onToggle,
  width,
  activityRailVisible,
  sidebarVisible,
  onViewChange,
  onSettings,
  onHelp,
}: Props) {
  const pinnedTools = usePinnedTools()
  const recentTools = useRecentTools()
  const [filterQueries, setFilterQueries] = useState<
    Record<SidebarView, string>
  >({ explorer: "", pinned: "", recent: "" })
  const [searchExpanded, setSearchExpanded] = useState(false)
  const searchInputRef = useRef<HTMLInputElement | null>(null)
  const [collapsedDomains, setCollapsedDomains] = useState<string[]>([])
  const scrollAreaRef = useRef<HTMLDivElement | null>(null)
  const [scrollEdges, setScrollEdges] = useState({ top: false, bottom: false })
  const filterQuery = filterQueries[view]
  const setFilterQuery = (value: string) =>
    setFilterQueries((current) => ({ ...current, [view]: value }))
  const query = filterQuery.trim().toLowerCase()
  const pinnedEntries = resolveStoredTools(pinnedTools)
  const recentEntries = resolveStoredTools(recentTools)
  const explorerEntries = allTools as WorkspaceTool[]
  const viewEntries =
    view === "pinned"
      ? pinnedEntries
      : view === "recent"
        ? recentEntries
        : explorerEntries
  const visibleViewEntries = query
    ? viewEntries.filter((tool) => includesQuery(tool, query))
    : viewEntries
  useEffect(() => {
    if (searchExpanded && !collapsed) searchInputRef.current?.focus()
  }, [collapsed, searchExpanded])
  useLayoutEffect(() => {
    const element = scrollAreaRef.current
    if (!element) return

    const updateScrollEdges = () => {
      const maxScroll = element.scrollHeight - element.clientHeight
      const next = {
        top: maxScroll > 1 && element.scrollTop > 1,
        bottom: maxScroll > 1 && element.scrollTop < maxScroll - 1,
      }
      setScrollEdges((current) =>
        current.top === next.top && current.bottom === next.bottom
          ? current
          : next
      )
    }

    const resizeObserver = new ResizeObserver(updateScrollEdges)
    resizeObserver.observe(element)
    const mutationObserver = new MutationObserver(updateScrollEdges)
    mutationObserver.observe(element, { childList: true, subtree: true })
    element.addEventListener("scroll", updateScrollEdges, { passive: true })
    const initialFrame = window.requestAnimationFrame(updateScrollEdges)

    return () => {
      window.cancelAnimationFrame(initialFrame)
      element.removeEventListener("scroll", updateScrollEdges)
      resizeObserver.disconnect()
      mutationObserver.disconnect()
    }
  }, [
    collapsed,
    collapsedDomains,
    query,
    sidebarVisible,
    view,
    visibleViewEntries.length,
  ])
  const heading =
    view === "pinned"
      ? "Pinned tools"
      : view === "recent"
        ? "Recent tools"
        : "Explorer"
  const HeadingIcon =
    view === "pinned" ? Star : view === "recent" ? Clock3 : FolderTree
  const frameClass = `flex h-full min-h-0 shrink-0 overflow-hidden`
  const activityRail = activityRailVisible ? (
    <ActivityRail
      view={view}
      onViewChange={onViewChange}
      onSettings={onSettings}
      onHelp={onHelp}
      sidebarVisible={sidebarVisible}
    />
  ) : null

  const toggleDomain = (domainId: string) => {
    setCollapsedDomains((current) =>
      current.includes(domainId)
        ? current.filter((id) => id !== domainId)
        : [...current, domainId]
    )
  }

  const openSearch = () => {
    setSearchExpanded(true)
    if (collapsed) onToggle()
  }
  const closeSearchOnLeave = () => {
    if (!filterQuery && document.activeElement !== searchInputRef.current) {
      setSearchExpanded(false)
    }
  }
  const expandAllDomains = () => setCollapsedDomains([])
  const collapseAllDomains = () =>
    setCollapsedDomains(domains.map((domain) => domain.id))

  if (!sidebarVisible) {
    return <div className={frameClass}>{activityRail}</div>
  }

  if (collapsed) {
    const shortcuts = visibleViewEntries
    return (
      <div className={frameClass}>
        {activityRail}
        <aside
          id="workspace-sidebar"
          aria-label="Collapsed domain and tool navigation"
          style={{ width }}
          className="group/sidebar flex shrink-0 flex-col items-center overflow-hidden rounded-md border"
        >
          <div className="flex p-1 w-full shrink-0 items-center justify-center">
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              title="Expand Explorer sidebar · ⌘B"
              aria-label="Expand Explorer sidebar · ⌘B"
              onClick={onToggle}
              className="size-8 text-muted-foreground transition-colors group-hover/sidebar:text-foreground"
            >
              <ChevronsRight className="size-4" />
            </Button>
          </div>
          <div className="relative flex min-h-0 w-full flex-1">
            <nav
              ref={scrollAreaRef}
              aria-label={heading}
              className="flex min-h-0 w-full flex-1 flex-col items-center gap-2 overflow-y-auto px-1.5 pb-1.5"
            >
              {view === "explorer"
                ? domains.map((domain) => {
                    const tools = shortcuts.filter(
                      (tool) => tool.domainId === domain.id
                    )
                    if (!tools.length) return null
                    const DomainIcon = domain.icon
                    return (
                      <section
                        key={domain.id}
                        aria-label={`${domain.name} tools`}
                        className="flex w-full shrink-0 flex-col items-center gap-1 rounded-sm border border-border/80 bg-muted/20 p-1"
                      >
                        <NavLink
                          to={`/domains/${domain.id}`}
                          end
                          title={`${domain.name} domain`}
                          aria-label={`${domain.name} domain`}
                          className={({ isActive }) =>
                            `flex h-6 w-full items-center justify-center gap-1 rounded-md text-[8px] font-semibold tracking-wide transition-colors ${isActive ? "text-primary" : "text-muted-foreground/80 hover:text-foreground"}`
                          }
                        >
                          <DomainIcon className="size-3.5" />
                        </NavLink>
                        <div className="flex w-full flex-col items-center gap-1">
                          {tools.map((tool) => {
                            const Icon = tool.icon
                            return (
                              <NavLink
                                key={`${tool.domainId}:${tool.id}`}
                                to={tool.href}
                                title={`${tool.domainName} · ${tool.name}`}
                                aria-label={`${tool.domainName}: ${tool.name}`}
                                className={({ isActive }) =>
                                  `grid size-8 shrink-0 place-items-center rounded-sm border transition-colors ${isActive ? "border-primary/30 bg-primary/10 text-primary shadow-sm" : "border-border/70 bg-background/70 text-muted-foreground hover:border-primary/25 hover:bg-background hover:text-foreground"}`
                                }
                              >
                                <Icon className="size-4" />
                              </NavLink>
                            )
                          })}
                        </div>
                      </section>
                    )
                  })
                : shortcuts.map((tool) => {
                    const Icon = tool.icon
                    return (
                      <NavLink
                        key={`${tool.domainId}:${tool.id}`}
                        to={tool.href}
                        title={`${tool.domainName} · ${tool.name}`}
                        aria-label={`${tool.domainName}: ${tool.name}`}
                        className={({ isActive }) =>
                          `grid size-10 shrink-0 place-items-center rounded-xl transition-colors ${isActive ? "bg-primary/10 text-primary ring-1 ring-primary/20" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`
                        }
                      >
                        <Icon className="size-4" />
                      </NavLink>
                    )
                  })}
              {!shortcuts.length && (
                <span
                  title={
                    view === "pinned"
                      ? "No pinned tools yet"
                      : "No recent tools"
                  }
                  className="mt-2 text-muted-foreground"
                >
                  <HeadingIcon className="size-4" />
                </span>
              )}
            </nav>
            {view === "explorer" && (
              <ScrollEdgeShadows
                showTop={scrollEdges.top}
                showBottom={scrollEdges.bottom}
              />
            )}
          </div>
        </aside>
      </div>
    )
  }

  const filteredDomains = domains
    .map((domain) => {
      const domainMatches =
        query.length > 0 && domain.name.toLowerCase().includes(query)
      const tools = domain.tools.filter(
        (tool) =>
          !query ||
          domainMatches ||
          includesQuery(
            { ...tool, domainId: domain.id, domainName: domain.name },
            query
          )
      )
      return { domain, tools, domainMatches }
    })
    .filter(
      ({ domain, tools }) =>
        !query || domain.name.toLowerCase().includes(query) || tools.length > 0
    )

  return (
    <div className={frameClass}>
      {activityRail}
      <aside
        id="workspace-sidebar"
        aria-label="Domain and tool navigation"
        style={{ width }}
        className="group/sidebar flex shrink-0 flex-col overflow-hidden rounded-md border transition-[width] duration-150"
      >
        <div className="flex w-full shrink-0 items-center justify-end gap-1 px-1 py-1">
          <div
            className={`group/search relative flex h-8 min-w-8 items-center rounded-md transition-[flex,width] duration-200 ${searchExpanded || filterQuery ? "flex-1" : "w-8"}`}
            onMouseEnter={() => setSearchExpanded(true)}
            onMouseLeave={closeSearchOnLeave}
          >
            {searchExpanded || filterQuery ? (
              <>
                <Search
                  aria-hidden="true"
                  className="pointer-events-none absolute left-2 size-3.5 text-muted-foreground"
                />
                <Input
                  ref={searchInputRef}
                  aria-label={`Filter ${heading.toLowerCase()}`}
                  placeholder={`Search ${heading.toLowerCase()}…`}
                  value={filterQuery}
                  onChange={(event) => {
                    setFilterQuery(event.target.value)
                    setSearchExpanded(true)
                  }}
                  onFocus={() => setSearchExpanded(true)}
                  onBlur={() => {
                    if (!filterQuery) setSearchExpanded(false)
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Escape") {
                      setFilterQuery("")
                      setSearchExpanded(false)
                      searchInputRef.current?.blur()
                    }
                  }}
                  className="h-8 rounded pr-7 pl-7 text-xs"
                />
                {filterQuery && (
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    aria-label="Clear sidebar search"
                    onClick={() => {
                      setFilterQuery("")
                      setSearchExpanded(true)
                      searchInputRef.current?.focus()
                    }}
                    className="absolute top-1/2 right-0.5 size-6 -translate-y-1/2"
                  >
                    <X className="size-3" />
                  </Button>
                )}
              </>
            ) : (
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                title="Search tools"
                aria-label="Search tools"
                onClick={openSearch}
                className="size-8 shrink-0 text-muted-foreground transition-colors group-hover/sidebar:text-foreground"
              >
                <Search className="size-3.5" />
              </Button>
            )}
          </div>
          {view === "explorer" && (
            <>
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                title="Expand all domains"
                aria-label="Expand all domains"
                onClick={expandAllDomains}
                className="size-7 shrink-0 text-muted-foreground transition-colors group-hover/sidebar:text-foreground"
              >
                <ChevronsDown className="size-3.5" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                title="Collapse all domains"
                aria-label="Collapse all domains"
                onClick={collapseAllDomains}
                className="size-7 shrink-0 text-muted-foreground transition-colors group-hover/sidebar:text-foreground"
              >
                <ChevronsUp className="size-3.5" />
              </Button>
            </>
          )}
          {view === "recent" && recentTools.length > 0 && (
            <Button
              variant="ghost"
              size="icon-xs"
              title="Clear recent tools"
              aria-label="Clear recent tools"
              onClick={clearRecentTools}
            >
              <Trash2 className="size-3.5" />
            </Button>
          )}
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            title="Collapse Explorer sidebar · ⌘B"
            aria-label="Collapse Explorer sidebar · ⌘B"
            onClick={onToggle}
            className="size-7 shrink-0 text-muted-foreground transition-colors group-hover/sidebar:text-foreground"
          >
            <ChevronsLeft className="size-3.5" />
          </Button>
        </div>

        <div className="relative min-h-0 w-full flex-1">
          <div
            ref={scrollAreaRef}
            className="h-full min-h-0 overflow-y-auto px-2 pb-2"
          >
            {view === "explorer" ? (
              <nav aria-label="Domains and tools" className="space-y-0.5">
                {filteredDomains.map(({ domain, tools, domainMatches }) => {
                  const DomainIcon = domain.icon
                  const isCollapsed =
                    collapsedDomains.includes(domain.id) && !query
                  return (
                    <section key={domain.id} className="mb-2 last:mb-0">
                      <div className="flex items-center gap-1">
                        <NavLink
                          to={`/domains/${domain.id}`}
                          end
                          className={({ isActive }) =>
                            `group flex h-8 min-w-0 flex-1 items-center gap-2 rounded-md pl-1 pr-2 text-xs font-medium transition-colors ${isActive ? "text-primary" : "text-muted-foreground hover:text-primary"}`
                          }
                        >
                          <DomainIcon className="size-3.5 shrink-0 transition-colors group-hover:text-primary group-[.active]:text-primary" />
                          <span className="min-w-0 flex-1 truncate underline decoration-transparent underline-offset-4 transition-colors group-hover:decoration-current group-[.active]:font-semibold group-[.active]:underline group-[.active]:decoration-current">
                            {domain.name}
                          </span>
                          <span className="text-[9px] text-muted-foreground tabular-nums">
                            {tools.length || "—"}
                          </span>
                        </NavLink>
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          aria-label={`${isCollapsed ? "Expand" : "Collapse"} ${domain.name}`}
                          aria-expanded={!isCollapsed}
                          onClick={() => toggleDomain(domain.id)}
                          className="h-6 w-6 shrink-0 text-muted-foreground"
                        >
                          <ChevronDown
                            className={`size-3 transition-transform ${isCollapsed ? "-rotate-90" : ""}`}
                          />
                        </Button>
                      </div>
                      {!isCollapsed && tools.length > 0 && (
                        <div className="mt-0.5 ml-2 space-y-0.5 border-l border-border/70 pl-1">
                          {tools.map((tool) => (
                            <ToolRow
                              key={tool.id}
                              tool={{
                                ...tool,
                                domainId: domain.id,
                                domainName: domain.name,
                              }}
                              pinned={pinnedTools.some(
                                (item) =>
                                  item.domainId === domain.id &&
                                  item.toolId === tool.id
                              )}
                            />
                          ))}
                        </div>
                      )}
                      {!isCollapsed && !tools.length && domainMatches && (
                        <p className="ml-9 px-2 py-1.5 text-[11px] text-muted-foreground">
                          No tools in this domain.
                        </p>
                      )}
                    </section>
                  )
                })}
                {query && !filteredDomains.length && (
                  <EmptySidebar
                    icon={Search}
                    title="No matches"
                    detail="Try a different name or description."
                  />
                )}
              </nav>
            ) : (
              <nav aria-label={heading} className="space-y-1">
                {visibleViewEntries.map((tool) => (
                  <ToolRow
                    key={`${tool.domainId}:${tool.id}`}
                    tool={tool}
                    pinned={pinnedTools.some(
                      (item) =>
                        item.domainId === tool.domainId &&
                        item.toolId === tool.id
                    )}
                    detail={view === "recent" ? "Recently opened" : undefined}
                  />
                ))}
                {!visibleViewEntries.length && (
                  <EmptySidebar
                    icon={HeadingIcon}
                    title={
                      query
                        ? "No matches"
                        : view === "pinned"
                          ? "No pinned tools yet"
                          : "No recent tools"
                    }
                    detail={
                      query
                        ? "Try a different name or description."
                        : view === "pinned"
                          ? "Star a tool in Explorer to keep it here."
                          : "Tools you open will appear here."
                    }
                  />
                )}
              </nav>
            )}
          </div>
          {view === "explorer" && (
            <ScrollEdgeShadows
              showTop={scrollEdges.top}
              showBottom={scrollEdges.bottom}
            />
          )}
        </div>
      </aside>
    </div>
  )
}

function ScrollEdgeShadows({
  showTop,
  showBottom,
}: {
  showTop: boolean
  showBottom: boolean
}) {
  return (
    <>
      {showTop && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 z-20 h-4 bg-gradient-to-b from-background via-background/85 to-transparent"
        />
      )}
      {showBottom && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-4 bg-gradient-to-t from-background via-background/85 to-transparent"
        />
      )}
    </>
  )
}

function ToolRow({
  tool,
  pinned,
  detail,
}: {
  tool: WorkspaceTool
  pinned: boolean
  detail?: string
}) {
  const Icon = tool.icon
  return (
    <div className="group flex items-center gap-1">
      <NavLink
        to={tool.href}
        className={({ isActive }) =>
          `ml-2 flex h-7 min-w-0 flex-1 items-center gap-2 rounded-md px-2 text-[11px] transition-colors ${isActive ? "bg-primary/10 font-medium text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`
        }
      >
        <Icon className="size-3.5 shrink-0" />
        <span className="flex min-w-0 flex-1 items-center gap-1.5">
          <span className="min-w-0 flex-1 truncate">{tool.name}</span>
          <ToolAvailabilityBadge availability={tool.availability} />
        </span>
        {detail && (
          <span className="shrink-0 text-[10px] text-muted-foreground">
            {detail}
          </span>
        )}
      </NavLink>
      <Button
        variant="ghost"
        size="icon-xs"
        title={`${pinned ? "Unpin" : "Pin"} ${tool.name}`}
        aria-label={`${pinned ? "Unpin" : "Pin"} ${tool.name}`}
        aria-pressed={pinned}
        onClick={() =>
          togglePinnedTool({
            domainId: tool.domainId,
            toolId: tool.id,
            href: tool.href,
          })
        }
        className={`h-6 w-6 shrink-0 transition-opacity ${pinned ? "text-amber-500" : "text-muted-foreground opacity-0 group-focus-within:opacity-100 group-hover:opacity-100"}`}
      >
        <Star className={`size-3.5 ${pinned ? "fill-current" : ""}`} />
      </Button>
    </div>
  )
}

function EmptySidebar({
  icon: Icon,
  title,
  detail,
}: {
  icon: typeof Search
  title: string
  detail: string
}) {
  return (
    <div className="mx-1 mt-3 rounded-lg border border-dashed px-3 py-4 text-center">
      <Icon className="mx-auto size-4 text-muted-foreground" />
      <p className="mt-2 text-xs font-medium">{title}</p>
      <p className="mt-1 text-[11px] leading-4 text-muted-foreground">
        {detail}
      </p>
    </div>
  )
}
