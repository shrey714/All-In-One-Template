import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Clock3, Info } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@workspace/ui/components/tooltip"
import { domains, getDomain, getTool } from "@/shared/config/registry"
import { ToolInfoSheet } from "@/shared/components/layout/ToolInfoSheet"
import { AppIcon } from "@/shared/components/display/AppIcon"
import { useAuth } from "@/app/providers/AuthProvider"
import { canAccessTool } from "@/shared/types/auth"
import type { ToolDefinition } from "@/shared/types/tool"
import { useRecentTools } from "@/shared/services/recent-tools"

type WorkspaceTool = ToolDefinition & { domainId: string; domainName: string }

export function HomePage() {
  const navigate = useNavigate()
  const { user, authEnabled } = useAuth()
  const recentRecords = useRecentTools()
  const [infoTool, setInfoTool] = useState<WorkspaceTool | null>(null)
  const [allToolsFilter, setAllToolsFilter] = useState("all")

  const hasToolAccess = (domainId: string, toolId: string) =>
    !authEnabled || Boolean(user && canAccessTool(user, domainId, toolId))
  const visibleDomains = domains
    .map((domain) => ({
      ...domain,
      tools: domain.tools.filter((tool) => hasToolAccess(domain.id, tool.id)),
    }))
    .filter((domain) => domain.tools.length > 0)
  const recentEntries = recentRecords.flatMap((record) => {
    const domain = getDomain(record.domainId)
    const tool = getTool(record.domainId, record.toolId)
    return domain && tool && hasToolAccess(domain.id, tool.id)
      ? [{ ...tool, domainId: domain.id, domainName: domain.name }]
      : []
  })
  const displayedDomains =
    allToolsFilter === "all"
      ? visibleDomains
      : visibleDomains.filter((domain) => domain.id === allToolsFilter)
  const toolCount = visibleDomains.reduce(
    (total, domain) => total + domain.tools.length,
    0
  )

  return (
    <TooltipProvider delayDuration={450}>
      <div className="mx-auto w-full max-w-[1440px] space-y-7 pb-6">
        <header className="flex flex-wrap items-end justify-between gap-3 border-b border-border/70 pb-4">
          <div>
            <p className="text-[10px] font-semibold tracking-[.16em] text-primary uppercase">
              Workspace
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
              Quick Access
            </h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Pick up where you left off, or browse your tools by domain.
            </p>
          </div>
        </header>

        <section
          aria-labelledby="recent-tools-heading"
          className="overflow-hidden rounded-2xl border border-border/80 bg-card/45 shadow-sm"
        >
          <div className="flex min-h-12 items-center justify-between gap-3 border-b border-border/70 px-4 py-2.5">
            <div className="flex min-w-0 items-center gap-2.5">
              <span className="grid size-8 shrink-0 place-items-center rounded-lg border bg-background text-primary shadow-sm">
                <Clock3 className="size-4" />
              </span>
              <h2
                id="recent-tools-heading"
                className="truncate text-base font-semibold tracking-tight"
              >
                Recently used
              </h2>
            </div>
            {recentEntries.length > 0 && (
              <span className="shrink-0 text-[11px] text-muted-foreground tabular-nums">
                {recentEntries.length}{" "}
                {recentEntries.length === 1 ? "app" : "apps"}
              </span>
            )}
          </div>
          {recentEntries.length ? (
            <div className="grid grid-cols-4 gap-x-1 gap-y-2 px-2 py-3 sm:grid-cols-5 sm:gap-x-2 sm:px-3 sm:py-4 md:grid-cols-6 lg:grid-cols-7 xl:grid-cols-8 2xl:grid-cols-9">
              {recentEntries.map((tool) => (
                <ToolAppTile
                  key={`${tool.domainId}:${tool.id}`}
                  tool={tool}
                  domainIndex={Math.max(
                    0,
                    visibleDomains.findIndex(
                      (domain) => domain.id === tool.domainId
                    )
                  )}
                  onOpen={() => navigate(tool.href)}
                />
              ))}
            </div>
          ) : (
            <div className="flex min-h-[116px] flex-col items-center justify-center gap-2 px-4 py-6 text-center">
              <p className="text-sm font-medium">
                Your applications will appear here
              </p>
              <p className="text-xs text-muted-foreground">
                Open a tool and it will be ready for quick access next time.
              </p>
            </div>
          )}
        </section>

        <section aria-labelledby="all-tools-heading">
          <div className="flex min-h-12 items-center justify-between gap-3">
            <div className="min-w-0">
              <h2
                id="all-tools-heading"
                className="truncate text-base font-semibold tracking-tight"
              >
                All tools
              </h2>
              <p className="mt-0.5 text-[11px] text-muted-foreground">
                Browse by domain
              </p>
            </div>
            <span className="shrink-0 text-[11px] text-muted-foreground tabular-nums">
              {toolCount} {toolCount === 1 ? "tool" : "tools"}
            </span>
          </div>

          <div
            role="group"
            aria-label="Filter tools by domain"
            className="mt-3 flex gap-1.5 overflow-x-auto py-1"
          >
            {[
              { id: "all", name: "All" },
              ...visibleDomains.map(({ id, name }) => ({ id, name })),
            ].map((item) => {
              const selected = allToolsFilter === item.id
              return (
                <button
                  key={item.id}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => setAllToolsFilter(item.id)}
                  className={`shrink-0 rounded-lg border px-3 py-1.5 text-[11px] font-medium transition-colors motion-reduce:transition-none ${selected ? "border-primary/25 bg-secondary text-secondary-foreground shadow-sm" : "border-transparent bg-muted/55 text-muted-foreground hover:border-border hover:bg-muted hover:text-foreground"}`}
                >
                  {item.name}
                </button>
              )
            })}
          </div>

          {displayedDomains.length ? (
            <div className="space-y-5 pt-1">
              {displayedDomains.map((domain, domainIndex) => (
                <section
                  key={domain.id}
                  aria-labelledby={`domain-${domain.id}-heading`}
                  className="space-y-1.5"
                >
                  <div className="flex min-h-9 items-center gap-2 border-b border-border/60 pb-1.5">
                    <span
                      className={`grid size-7 shrink-0 place-items-center rounded-lg border ${domainTone(domainIndex)}`}
                    >
                      <AppIcon icon={domain.icon} className="size-3.5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <h3
                        id={`domain-${domain.id}-heading`}
                        className="truncate text-sm font-semibold tracking-tight"
                      >
                        {domain.name}
                      </h3>
                      <p className="truncate text-[10px] text-muted-foreground">
                        {domain.description}
                      </p>
                    </div>
                    <span className="shrink-0 text-[10px] text-muted-foreground tabular-nums">
                      {domain.tools.length}{" "}
                      {domain.tools.length === 1 ? "tool" : "tools"}
                    </span>
                  </div>
                  <div className="grid grid-cols-4 gap-x-1 gap-y-2 sm:grid-cols-5 sm:gap-x-2 md:grid-cols-6 lg:grid-cols-7 xl:grid-cols-8 2xl:grid-cols-9">
                    {domain.tools.map((tool) => {
                      const entry: WorkspaceTool = {
                        ...tool,
                        domainId: domain.id,
                        domainName: domain.name,
                      }
                      return (
                        <ToolAppTile
                          key={tool.id}
                          tool={entry}
                          domainIndex={domainIndex}
                          showDetails
                          onOpen={() => navigate(tool.href)}
                          onInfo={setInfoTool}
                        />
                      )
                    })}
                  </div>
                </section>
              ))}
            </div>
          ) : (
            <p className="px-4 py-8 text-center text-sm text-muted-foreground">
              No tools are available for this account.
            </p>
          )}
        </section>
        <ToolInfoSheet tool={infoTool} onClose={() => setInfoTool(null)} />
      </div>
    </TooltipProvider>
  )
}

function ToolAppTile({
  tool,
  domainIndex,
  showDetails = false,
  onOpen,
  onInfo,
}: {
  tool: WorkspaceTool
  domainIndex: number
  showDetails?: boolean
  onOpen: () => void
  onInfo?: (tool: WorkspaceTool) => void
}) {
  const appButton = (
    <button
      type="button"
      onClick={onOpen}
      aria-label={`Open ${tool.name} in ${tool.domainName}`}
      className="group flex min-w-0 flex-col items-center gap-2 rounded-xl px-1.5 py-2 text-center transition-colors hover:bg-accent/45 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none motion-reduce:transition-none sm:gap-2.5 sm:px-2 sm:py-2.5"
    >
      <span
        className={`grid size-16 place-items-center rounded-[18px] border shadow-md transition-transform group-hover:scale-[1.04] group-hover:shadow-lg group-active:scale-[0.98] motion-reduce:transition-none sm:size-[72px] sm:rounded-[20px] ${appTileTone(domainIndex)}`}
        aria-hidden="true"
      >
        <AppIcon icon={tool.icon} className="size-8 sm:size-9" />
      </span>
      <span className="line-clamp-2 min-h-8 max-w-full text-[11px] leading-4 font-medium break-words sm:text-xs">
        {tool.name}
      </span>
    </button>
  )

  return (
    <div className="group/app-tile relative flex min-w-0 justify-center">
      {showDetails ? (
        <Tooltip>
          <TooltipTrigger asChild>{appButton}</TooltipTrigger>
          <TooltipContent
            side="bottom"
            sideOffset={6}
            className="max-w-[260px] text-center leading-relaxed whitespace-normal"
          >
            {tool.description}
          </TooltipContent>
        </Tooltip>
      ) : (
        appButton
      )}
      {showDetails && onInfo && (
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          aria-label={`Info: ${tool.name}`}
          title={`Info: ${tool.name}`}
          onClick={() => onInfo(tool)}
          className="absolute top-1 left-[calc(50%_+_12px)] z-10 size-7 rounded-full border bg-background/95 text-muted-foreground opacity-100 shadow-sm transition-opacity hover:bg-background hover:text-foreground motion-reduce:transition-none sm:left-[calc(50%_+_16px)] md:opacity-0 md:group-focus-within/app-tile:opacity-100 md:group-hover/app-tile:opacity-100"
        >
          <Info className="size-3.5" />
        </Button>
      )}
    </div>
  )
}

function appTileTone(index: number) {
  const tones = [
    "border-emerald-500/25 bg-gradient-to-br from-emerald-400/35 via-teal-500/15 to-background text-emerald-800 shadow-emerald-500/10 dark:text-emerald-200",
    "border-violet-500/25 bg-gradient-to-br from-violet-400/35 via-indigo-500/15 to-background text-violet-800 shadow-violet-500/10 dark:text-violet-200",
    "border-cyan-500/25 bg-gradient-to-br from-cyan-400/35 via-sky-500/15 to-background text-cyan-800 shadow-cyan-500/10 dark:text-cyan-200",
    "border-amber-500/25 bg-gradient-to-br from-amber-400/35 via-orange-500/15 to-background text-amber-800 shadow-amber-500/10 dark:text-amber-200",
    "border-rose-500/25 bg-gradient-to-br from-rose-400/35 via-pink-500/15 to-background text-rose-800 shadow-rose-500/10 dark:text-rose-200",
  ]
  return tones[index % tones.length]
}

function domainTone(index: number) {
  const tones = [
    "border-violet-500/20 bg-violet-500/10 text-violet-600 dark:text-violet-300",
    "border-cyan-500/20 bg-cyan-500/10 text-cyan-700 dark:text-cyan-300",
    "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
    "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300",
    "border-rose-500/20 bg-rose-500/10 text-rose-700 dark:text-rose-300",
  ]
  return tones[index % tones.length]
}
