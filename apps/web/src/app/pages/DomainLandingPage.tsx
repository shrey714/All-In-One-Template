import { useState } from "react"
import { Compass, Info, MoreHorizontal, Pin, Plus, Star } from "lucide-react"
import { Link, useParams } from "react-router-dom"
import { Button } from "@workspace/ui/components/button"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@workspace/ui/components/tooltip"
import { useAuth } from "@/app/providers/AuthProvider"
import { AppIcon } from "@/shared/components/display/AppIcon"
import { ToolInfoSheet } from "@/shared/components/layout/ToolInfoSheet"
import { ToolAvailabilityBadge } from "@/shared/components/tools/ToolAvailability"
import { getDomain } from "@/shared/config/registry"
import {
  MAX_PINNED_TOOLS,
  isToolPinned,
  togglePinnedTool,
  usePinnedTools,
} from "@/shared/services/pinned-tools"
import {
  isToolFavorite,
  toggleFavoriteTool,
  useFavoriteTools,
} from "@/shared/services/favorite-tools"
import { canAccessTool } from "@/shared/types/auth"
import type { ToolDefinition } from "@/shared/types/tool"

type DomainTool = ToolDefinition & { domainId: string; domainName: string }

export function DomainLandingPage() {
  const { domainId = "" } = useParams()
  const { user, authEnabled } = useAuth()
  const [infoTool, setInfoTool] = useState<DomainTool | null>(null)
  const favoriteTools = useFavoriteTools()
  const pinnedTools = usePinnedTools()
  const domain = getDomain(domainId)

  if (!domain) return null

  const visibleTools = authEnabled
    ? domain.tools.filter(
        (tool) => user && canAccessTool(user, domain.id, tool.id)
      )
    : domain.tools
  const accent = domainAccent(domain.tone)

  return (
    <TooltipProvider delayDuration={450}>
      <div className="mx-auto w-full max-w-[1440px] space-y-7 pb-6">
        <header className="relative isolate overflow-hidden rounded-2xl border border-border/70 bg-gradient-to-br from-card via-card to-muted/45 px-5 py-5 shadow-sm sm:px-7 sm:py-6">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-24 right-0 size-64 rounded-full bg-primary/[.08] blur-3xl"
          />
          <div className="relative flex flex-wrap items-center gap-4 sm:gap-5">
            <span
              className={`grid size-16 shrink-0 place-items-center rounded-[18px] border shadow-md sm:size-[72px] sm:rounded-[20px] ${accent}`}
              aria-hidden="true"
            >
              <AppIcon icon={domain.icon} className="size-8 sm:size-9" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-semibold tracking-[.16em] text-primary uppercase">
                Domain workspace
              </p>
              <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
                {domain.name}
              </h1>
              <p className="mt-1.5 max-w-2xl text-sm leading-5 text-muted-foreground">
                {domain.description}
              </p>
            </div>
            <div className="flex min-w-[94px] items-center gap-3 rounded-xl border border-border/70 bg-background/75 px-3.5 py-2.5 shadow-sm">
              <span className="text-2xl leading-none font-semibold tabular-nums">
                {visibleTools.length}
              </span>
              <span className="text-[10px] leading-4 text-muted-foreground">
                {visibleTools.length === 1 ? "tool" : "tools"}
                <br />
                listed
              </span>
            </div>
          </div>
        </header>

        <section aria-labelledby="domain-tools-heading" className="space-y-4">
          <div className="flex flex-wrap items-end justify-between gap-3 border-b border-border/60 pb-3">
            <div>
              <p className="text-[10px] font-semibold tracking-[.14em] text-muted-foreground uppercase">
                {domain.name} collection
              </p>
              <h2
                id="domain-tools-heading"
                className="mt-1 text-lg font-semibold tracking-tight"
              >
                Tools
              </h2>
            </div>
            <p className="text-xs text-muted-foreground">
              Select an app to open it; hover for details.
            </p>
          </div>

          {visibleTools.length ? (
            <div className="grid grid-cols-4 gap-x-1 gap-y-2 sm:grid-cols-5 sm:gap-x-2 md:grid-cols-6 lg:grid-cols-7 xl:grid-cols-8 2xl:grid-cols-9">
              {visibleTools.map((tool) => {
                const entry: DomainTool = {
                  ...tool,
                  domainId: domain.id,
                  domainName: domain.name,
                }
                return (
                  <DomainToolTile
                    key={tool.id}
                    tool={entry}
                    accent={accent}
                    favorite={isToolFavorite(favoriteTools, {
                      domainId: domain.id,
                      toolId: tool.id,
                    })}
                    pinned={isToolPinned(pinnedTools, {
                      domainId: domain.id,
                      toolId: tool.id,
                      href: tool.href,
                    })}
                    pinLimitReached={pinnedTools.length >= MAX_PINNED_TOOLS}
                    onInfo={setInfoTool}
                  />
                )
              })}
            </div>
          ) : (
            <div className="relative overflow-hidden rounded-2xl border border-dashed border-border/80 bg-muted/15 px-5 py-10 text-center sm:py-12">
              <span className="mx-auto grid size-12 place-items-center rounded-2xl border bg-background text-muted-foreground shadow-sm">
                <Compass className="size-5" aria-hidden="true" />
              </span>
              <h3 className="mt-3 text-sm font-semibold">
                {domain.tools.length
                  ? "No tools assigned"
                  : `Your ${domain.name.toLowerCase()} toolkit starts here`}
              </h3>
              <p className="mx-auto mt-1 max-w-md text-xs leading-relaxed text-muted-foreground">
                {domain.tools.length ? (
                  "Your account does not currently have access to tools in this domain. Ask an administrator to assign a matching role."
                ) : (
                  <>
                    The domain scaffold is ready. Add a tool folder under{" "}
                    <code className="rounded bg-muted px-1 py-0.5">
                      src/domains/{domain.id}/tools
                    </code>
                    , then register it in the central tool catalog.
                  </>
                )}
              </p>
              <Button asChild variant="outline" size="sm" className="mt-4">
                <Link to="/">
                  <Plus className="size-3.5" />
                  Explore workspace
                </Link>
              </Button>
            </div>
          )}
        </section>

        <ToolInfoSheet tool={infoTool} onClose={() => setInfoTool(null)} />
      </div>
    </TooltipProvider>
  )
}

function DomainToolTile({
  tool,
  accent,
  favorite,
  pinned,
  pinLimitReached,
  onInfo,
}: {
  tool: DomainTool
  accent: string
  favorite: boolean
  pinned: boolean
  pinLimitReached: boolean
  onInfo: (tool: DomainTool) => void
}) {
  const pinInput = {
    domainId: tool.domainId,
    toolId: tool.id,
    href: tool.href,
  }

  return (
    <div className="group/domain-tool relative flex min-w-0 justify-center">
      <Tooltip>
        <TooltipTrigger asChild>
          <Link
            to={tool.href}
            aria-label={`Open ${tool.name} in ${tool.domainName}`}
            className="flex min-w-0 flex-col items-center gap-2 rounded-xl px-1.5 py-2 text-center transition-colors hover:bg-accent/45 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none motion-reduce:transition-none sm:gap-2.5 sm:px-2 sm:py-2.5"
          >
            <span
              className={`grid size-16 place-items-center rounded-[18px] border shadow-md transition-transform group-hover/domain-tool:scale-[1.04] group-hover/domain-tool:shadow-lg group-active/domain-tool:scale-[.98] motion-reduce:transition-none sm:size-[72px] sm:rounded-[20px] ${accent}`}
              aria-hidden="true"
            >
              <AppIcon icon={tool.icon} className="size-8 sm:size-9" />
            </span>
            <span className="flex min-h-8 max-w-full min-w-0 items-center justify-center gap-1.5 text-[11px] leading-4 font-medium sm:text-xs">
              <span className="line-clamp-2 min-w-0 break-words">
                {tool.name}
              </span>
              {favorite && (
                <span
                  role="img"
                  aria-label="Favorite tool"
                  title="Favorite tool"
                  className="size-1.5 shrink-0 rounded-full bg-amber-400 ring-2 ring-background"
                />
              )}
              {pinned && (
                <span role="img" aria-label="Pinned tool" title="Pinned tool">
                  <Pin
                    className="size-3 shrink-0 text-primary"
                    aria-hidden="true"
                  />
                </span>
              )}
            </span>
            <span className="flex min-h-5 max-w-full items-start justify-center">
              <ToolAvailabilityBadge availability={tool.availability} />
            </span>
          </Link>
        </TooltipTrigger>
        <TooltipContent
          side="bottom"
          sideOffset={6}
          className="max-w-[260px] text-center leading-relaxed whitespace-normal"
        >
          {tool.description}
          {tool.availability?.message && (
            <span className="mt-1 block text-background/75">
              {tool.availability.message}
            </span>
          )}
        </TooltipContent>
      </Tooltip>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            aria-label={`More actions for ${tool.name}`}
            title={`More actions for ${tool.name}`}
            className="absolute top-1 left-[calc(50%_+_12px)] z-10 size-7 rounded-full border bg-background/95 text-muted-foreground opacity-100 shadow-sm transition-opacity hover:bg-background hover:text-foreground data-[state=open]:text-foreground motion-reduce:transition-none sm:left-[calc(50%_+_16px)] md:opacity-0 md:group-focus-within/domain-tool:opacity-100 md:group-hover/domain-tool:opacity-100"
          >
            <MoreHorizontal className="size-3.5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" side="bottom" className="w-48">
          <DropdownMenuItem onSelect={() => onInfo(tool)}>
            <Info className="size-3.5" />
            Info
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuCheckboxItem
            checked={favorite}
            onCheckedChange={() =>
              toggleFavoriteTool({ domainId: tool.domainId, toolId: tool.id })
            }
          >
            <Star
              className={`size-3.5 ${favorite ? "fill-current text-amber-500" : ""}`}
            />
            Favorite
          </DropdownMenuCheckboxItem>
          {pinLimitReached && !pinned ? (
            <DropdownMenuItem disabled>
              <Pin className="size-3.5" />
              Pin limit reached ({MAX_PINNED_TOOLS})
            </DropdownMenuItem>
          ) : (
            <DropdownMenuCheckboxItem
              checked={pinned}
              onCheckedChange={() => togglePinnedTool(pinInput)}
            >
              <Pin
                className={`size-3.5 ${pinned ? "fill-current text-primary" : ""}`}
              />
              {pinned ? "Unpin tool" : "Pin to top"}
            </DropdownMenuCheckboxItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

function domainAccent(tone: string) {
  const accents: Record<string, string> = {
    blue: "border-blue-500/25 bg-gradient-to-br from-blue-400/35 via-indigo-500/15 to-background text-blue-800 shadow-blue-500/10 dark:text-blue-200",
    cyan: "border-cyan-500/25 bg-gradient-to-br from-cyan-400/35 via-sky-500/15 to-background text-cyan-800 shadow-cyan-500/10 dark:text-cyan-200",
    emerald:
      "border-emerald-500/25 bg-gradient-to-br from-emerald-400/35 via-teal-500/15 to-background text-emerald-800 shadow-emerald-500/10 dark:text-emerald-200",
    violet:
      "border-violet-500/25 bg-gradient-to-br from-violet-400/35 via-indigo-500/15 to-background text-violet-800 shadow-violet-500/10 dark:text-violet-200",
    amber:
      "border-amber-500/25 bg-gradient-to-br from-amber-400/35 via-orange-500/15 to-background text-amber-800 shadow-amber-500/10 dark:text-amber-200",
  }
  return accents[tone] ?? accents.blue
}
