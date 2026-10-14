import { useState } from "react"
import { NavLink } from "react-router-dom"
import {
  Check,
  ChevronDown,
  ChevronsLeft,
  ChevronsRight,
  Clock3,
  FolderTree,
  Search,
  Star,
  Trash2,
  X,
} from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { allTools, domains, getDomain, getTool } from "@/shared/config/registry"
import type { SidebarView } from "@/shared/components/layout/ActivityRail"
import type { ToolDefinition } from "@/shared/types/tool"
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

export function WorkspaceSidebar({ view, collapsed, onToggle, width }: Props) {
  const pinnedTools = usePinnedTools()
  const recentTools = useRecentTools()
  const [filterOpen, setFilterOpen] = useState(false)
  const [filterQueries, setFilterQueries] = useState<
    Record<SidebarView, string>
  >({ explorer: "", pinned: "", recent: "" })
  const [collapsedDomains, setCollapsedDomains] = useState<string[]>([])
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
  const heading =
    view === "pinned"
      ? "Pinned tools"
      : view === "recent"
        ? "Recent tools"
        : "Explorer"
  const HeadingIcon =
    view === "pinned" ? Star : view === "recent" ? Clock3 : FolderTree

  const toggleDomain = (domainId: string) => {
    setCollapsedDomains((current) =>
      current.includes(domainId)
        ? current.filter((id) => id !== domainId)
        : [...current, domainId]
    )
  }

  if (collapsed) {
    const shortcuts = visibleViewEntries
    return (
      <aside
        id="workspace-sidebar"
        aria-label="Collapsed domain and tool navigation"
        style={{ width }}
        className="mr-0.5 flex shrink-0 flex-col items-center overflow-hidden rounded-r-md border border-border"
      >
        <div className="grid h-[54px] w-full shrink-0 place-items-center border-b border-border">
          <FolderTree className="size-4 text-primary" />
        </div>
        <nav
          aria-label={heading}
          className="flex min-h-0 w-full flex-1 flex-col items-center gap-2 overflow-y-auto px-2 py-3"
        >
          {shortcuts.map((tool) => {
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
                view === "pinned" ? "No pinned tools yet" : "No recent tools"
              }
              className="mt-2 text-muted-foreground"
            >
              <HeadingIcon className="size-4" />
            </span>
          )}
        </nav>
        <div className="flex w-full justify-center border-t border-border py-3">
          <Button
            variant="ghost"
            size="icon"
            title="Expand sidebar · ⌘B"
            aria-label="Expand sidebar · ⌘B"
            onClick={onToggle}
          >
            <ChevronsRight />
          </Button>
        </div>
      </aside>
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
    <aside
      id="workspace-sidebar"
      aria-label="Domain and tool navigation"
      style={{ width }}
      className="mr-0.5 flex shrink-0 flex-col overflow-hidden rounded-r-md border border-border transition-[width] duration-150"
    >
      <div className="flex h-[54px] w-full shrink-0 items-center justify-between border-b border-border px-4">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground">
            <FolderTree className="size-3.5" />
          </span>
          <span className="truncate text-xs font-semibold tracking-wide">
            ORBIT WORKSPACE
          </span>
        </div>
        <Button
          variant="ghost"
          size="icon-xs"
          title="Collapse sidebar · ⌘B"
          aria-label="Collapse sidebar · ⌘B"
          onClick={onToggle}
        >
          <ChevronsLeft className="size-4" />
        </Button>
      </div>

      <div className="flex w-full shrink-0 items-center justify-between px-4 pt-4 pb-2">
        <div className="flex min-w-0 items-center gap-2">
          <HeadingIcon className="size-3.5 text-muted-foreground" />
          <span className="truncate text-[10px] font-bold tracking-[.16em] text-muted-foreground uppercase">
            {heading}
          </span>
        </div>
        <div className="flex shrink-0 items-center gap-1">
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
            variant="ghost"
            size="icon-xs"
            title={
              filterOpen
                ? "Close sidebar filter"
                : `Filter ${heading.toLowerCase()}`
            }
            aria-label={
              filterOpen
                ? "Close sidebar filter"
                : `Filter ${heading.toLowerCase()}`
            }
            aria-pressed={filterOpen}
            onClick={() => {
              setFilterOpen((value) => !value)
              setFilterQuery("")
            }}
          >
            <Search className="size-3.5" />
          </Button>
        </div>
      </div>
      {filterOpen && (
        <div className="px-3 pb-3">
          <div className="relative">
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              autoFocus
              aria-label={`Filter ${heading.toLowerCase()}`}
              placeholder={`Filter ${heading.toLowerCase()}…`}
              value={filterQuery}
              onChange={(event) => setFilterQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Escape") {
                  setFilterQuery("")
                  setFilterOpen(false)
                }
              }}
              className="h-8 pr-8 pl-8 text-xs"
            />
            {filterQuery && (
              <Button
                variant="ghost"
                size="icon-xs"
                aria-label="Clear sidebar filter"
                onClick={() => setFilterQuery("")}
                className="absolute top-1/2 right-1 size-6 -translate-y-1/2"
              >
                <X className="size-3" />
              </Button>
            )}
          </div>
        </div>
      )}

      <div className="min-h-0 w-full flex-1 overflow-y-auto px-2 pb-3">
        {view === "explorer" ? (
          <nav aria-label="Domains and tools" className="space-y-1">
            {filteredDomains.map(({ domain, tools, domainMatches }) => {
              const DomainIcon = domain.icon
              const isCollapsed = collapsedDomains.includes(domain.id) && !query
              return (
                <section key={domain.id} className="mb-4 last:mb-0">
                  <div className="flex items-center gap-1">
                    <NavLink
                      to={`/domains/${domain.id}`}
                      end
                      className={({ isActive }) =>
                        `group flex h-9 min-w-0 flex-1 items-center gap-2.5 rounded-lg px-2.5 text-[13px] font-medium transition-colors ${isActive ? "bg-muted font-semibold text-foreground" : "text-muted-foreground hover:bg-muted/70 hover:text-foreground"}`
                      }
                    >
                      <DomainIcon className="size-4 shrink-0" />
                      <span className="min-w-0 flex-1 truncate">
                        {domain.name}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {domain.tools.length || "—"}
                      </span>
                    </NavLink>
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      aria-label={`${isCollapsed ? "Expand" : "Collapse"} ${domain.name}`}
                      aria-expanded={!isCollapsed}
                      onClick={() => toggleDomain(domain.id)}
                      className="h-7 w-7 shrink-0 text-muted-foreground"
                    >
                      <ChevronDown
                        className={`size-3 transition-transform ${isCollapsed ? "-rotate-90" : ""}`}
                      />
                    </Button>
                  </div>
                  {!isCollapsed && tools.length > 0 && (
                    <div className="mt-1.5 space-y-1">
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
                    item.domainId === tool.domainId && item.toolId === tool.id
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
      <div className="w-full shrink-0 border-t border-border px-3 py-3">
        <div className="flex items-center justify-between gap-2 rounded-lg bg-muted/60 px-3 py-2">
          <div className="flex min-w-0 items-center gap-2">
            <span className="size-2 shrink-0 rounded-full bg-emerald-500" />
            <span className="truncate text-[11px] text-muted-foreground">
              {view === "explorer"
                ? "Workspace ready"
                : `${view === "pinned" ? pinnedEntries.length : recentEntries.length} ${view === "pinned" ? "pinned" : "recent"}`}
            </span>
          </div>
          <span className="flex shrink-0 items-center gap-1 text-[10px] text-muted-foreground">
            <Check className="size-3" />
            Local
          </span>
        </div>
      </div>
    </aside>
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
          `ml-3 flex h-8 min-w-0 flex-1 items-center gap-2 rounded-md border-l pr-2 pl-3 text-xs transition-colors ${isActive ? "border-primary bg-primary/8 font-medium text-primary" : "border-border text-muted-foreground hover:border-muted-foreground/40 hover:bg-muted hover:text-foreground"}`
        }
      >
        <Icon className="size-3.5 shrink-0" />
        <span className="min-w-0 flex-1 truncate">{tool.name}</span>
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
        className={`h-7 w-7 shrink-0 ${pinned ? "text-amber-500" : "text-muted-foreground"}`}
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
