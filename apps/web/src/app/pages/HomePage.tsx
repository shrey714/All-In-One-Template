import { useNavigate } from "react-router-dom"
import {
  ArrowUpRight,
  Blocks,
  Compass,
  Grid2X2,
  Sparkles,
  Star,
} from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import { Card, CardContent } from "@workspace/ui/components/card"
import { allTools, domains, getDomain, getTool } from "@/shared/config/registry"
import {
  MAX_PINNED_TOOLS,
  togglePinnedTool,
  usePinnedTools,
} from "@/shared/services/pinned-tools"
import type { ToolDefinition } from "@/shared/types/tool"
import { ToolAvailabilityBadge } from "@/shared/components/tools/ToolAvailability"

type WorkspaceTool = ToolDefinition & { domainId: string; domainName: string }

export function HomePage() {
  const navigate = useNavigate()
  const pinnedTools = usePinnedTools()
  const pinnedEntries = pinnedTools.flatMap((record) => {
    const domain = getDomain(record.domainId)
    const tool = getTool(record.domainId, record.toolId)
    return domain && tool
      ? [{ ...tool, domainId: domain.id, domainName: domain.name }]
      : []
  })
  const stats = [
    { label: "Domains", value: domains.length, icon: Grid2X2 },
    { label: "Tools", value: allTools.length, icon: Blocks },
    { label: "Pinned", value: pinnedEntries.length, icon: Star },
  ]

  return (
    <div className="space-y-8">
      <section className="space-y-2">
        <div className="flex items-center gap-2 text-[11px] font-semibold tracking-[.12em] text-primary">
          <Sparkles className="size-3.5" />
          WORKSPACE OVERVIEW
        </div>
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
          Good to have you back.
        </h1>
        <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
          Your domains and everyday tools, organized in one focused workspace.
        </p>
      </section>

      <section
        aria-label="Workspace summary"
        className="grid grid-cols-3 gap-3"
      >
        {stats.map(({ label, value, icon: Icon }) => (
          <Card key={label} className="shadow-none">
            <CardContent className="flex min-w-0 items-center gap-2.5 px-3 py-3.5 sm:gap-3.5 sm:px-4">
              <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                <Icon className="size-4" />
              </span>
              <div className="min-w-0">
                <p className="truncate text-[11px] text-muted-foreground sm:text-xs">
                  {label}
                </p>
                <p className="mt-0.5 text-xl leading-none font-semibold tabular-nums">
                  {String(value).padStart(2, "0")}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </section>

      <section aria-labelledby="pinned-heading" className="space-y-3">
        <SectionHeading
          eyebrow="Quick access"
          title="Pinned tools"
          count={pinnedEntries.length}
          id="pinned-heading"
        />
        {pinnedEntries.length ? (
          <div className="grid gap-3 lg:grid-cols-2">
            {pinnedEntries.map((tool) => (
              <ToolActionRow
                key={`${tool.domainId}:${tool.id}`}
                tool={tool}
                pinned
                pinLimitReached={false}
                onOpen={() => navigate(tool.href)}
              />
            ))}
          </div>
        ) : (
          <div className="flex items-center gap-3 rounded-xl border border-dashed bg-muted/20 px-4 py-4">
            <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-background text-muted-foreground">
              <Star className="size-4" />
            </span>
            <div className="min-w-0">
              <h3 className="text-sm font-medium">
                Keep your go-to tools close
              </h3>
              <p className="mt-0.5 text-xs leading-5 text-muted-foreground">
                Select the star on any tool to pin it here and in the Pinned
                sidebar view.
              </p>
            </div>
          </div>
        )}
      </section>

      <section aria-labelledby="domains-heading" className="space-y-3">
        <SectionHeading
          eyebrow="Browse"
          title="Domains &amp; toolkits"
          id="domains-heading"
        />
        <div className="grid gap-4 xl:grid-cols-2">
          {domains.map((domain) => {
            const DomainIcon = domain.icon
            return (
              <Card
                key={domain.id}
                className="overflow-hidden shadow-none transition-colors hover:border-primary/25"
              >
                <CardContent className="p-0">
                  <div className="flex items-center gap-3 border-b px-4 py-4">
                    <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                      <DomainIcon className="size-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate text-sm font-semibold">
                        {domain.name}
                      </h3>
                      <p className="mt-0.5 truncate text-xs leading-5 text-muted-foreground">
                        {domain.description}
                      </p>
                    </div>
                    <span className="shrink-0 rounded-md border bg-muted/30 px-2 py-1 text-[10px] text-muted-foreground">
                      {domain.tools.length}{" "}
                      {domain.tools.length === 1 ? "tool" : "tools"}
                    </span>
                  </div>
                  {domain.tools.length ? (
                    <div className="divide-y divide-border/70">
                      {domain.tools.map((tool) => {
                        const entry: WorkspaceTool = {
                          ...tool,
                          domainId: domain.id,
                          domainName: domain.name,
                        }
                        const pinned = pinnedTools.some(
                          (item) =>
                            item.domainId === domain.id &&
                            item.toolId === tool.id
                        )
                        return (
                          <ToolActionRow
                            key={tool.id}
                            tool={entry}
                            pinned={pinned}
                            pinLimitReached={
                              pinnedTools.length >= MAX_PINNED_TOOLS
                            }
                            onOpen={() => navigate(tool.href)}
                          />
                        )
                      })}
                    </div>
                  ) : (
                    <Button
                      variant="ghost"
                      className="h-auto min-h-[64px] w-full justify-start gap-3 rounded-none px-4 py-3 text-left text-xs font-normal text-muted-foreground"
                      onClick={() => navigate(`/domains/${domain.id}`)}
                    >
                      <span className="grid size-8 shrink-0 place-items-center rounded-lg border border-dashed">
                        <Compass className="size-3.5" />
                      </span>
                      <span className="min-w-0 flex-1">
                        Starter domain · open to see how to add tools
                      </span>
                      <ArrowUpRight className="size-3.5 shrink-0" />
                    </Button>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      </section>
    </div>
  )
}

function SectionHeading({
  eyebrow,
  title,
  count,
  id,
}: {
  eyebrow: string
  title: string
  count?: number
  id?: string
}) {
  return (
    <div className="flex min-h-10 items-end justify-between gap-3">
      <div>
        <p className="text-[10px] font-semibold tracking-[.14em] text-muted-foreground uppercase">
          {eyebrow}
        </p>
        <h2 id={id} className="mt-1 text-lg leading-6 font-semibold">
          {title}
        </h2>
      </div>
      {count !== undefined && (
        <span className="mb-0.5 rounded-md border bg-card px-2 py-1 text-[10px] text-muted-foreground tabular-nums">
          {count} pinned
        </span>
      )}
    </div>
  )
}

function ToolActionRow({
  tool,
  pinned,
  pinLimitReached,
  onOpen,
}: {
  tool: WorkspaceTool
  pinned: boolean
  pinLimitReached: boolean
  onOpen: () => void
}) {
  const Icon = tool.icon
  return (
    <div className="flex min-w-0 items-center gap-1 px-1">
      <Button
        variant="ghost"
        className="h-auto min-h-[64px] min-w-0 flex-1 justify-start gap-3 rounded-lg px-3 py-3 text-left"
        onClick={onOpen}
      >
        <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-muted text-foreground">
          <Icon className="size-4" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex min-w-0 items-center gap-1.5">
            <span className="min-w-0 flex-1 truncate text-xs font-medium">
              {tool.name}
            </span>
            <ToolAvailabilityBadge availability={tool.availability} />
          </span>
          <span className="mt-1 block truncate text-[11px] leading-4 font-normal text-muted-foreground">
            {tool.description}
          </span>
        </span>
        <ArrowUpRight className="size-3.5 shrink-0 text-muted-foreground" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        title={`${pinned ? "Unpin" : "Pin"} ${tool.name}`}
        aria-label={`${pinned ? "Unpin" : "Pin"} ${tool.name}`}
        aria-pressed={pinned}
        disabled={!pinned && pinLimitReached}
        onClick={() =>
          togglePinnedTool({
            domainId: tool.domainId,
            toolId: tool.id,
            href: tool.href,
          })
        }
        className={`mr-2 size-8 shrink-0 ${pinned ? "text-amber-500" : "text-muted-foreground"}`}
      >
        <Star className={`size-4 ${pinned ? "fill-current" : ""}`} />
      </Button>
    </div>
  )
}
