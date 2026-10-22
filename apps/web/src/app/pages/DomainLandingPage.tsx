import { ArrowUpRight, Compass, Plus } from "lucide-react"
import { Link, useParams } from "react-router-dom"
import { Button } from "@workspace/ui/components/button"
import { Card, CardContent } from "@workspace/ui/components/card"
import { ToolAvailabilityBadge } from "@/shared/components/tools/ToolAvailability"
import { getDomain } from "@/shared/config/registry"

export function DomainLandingPage() {
  const { domainId = "" } = useParams()
  const domain = getDomain(domainId)
  if (!domain) return null
  const Icon = domain.icon

  return (
    <div className="space-y-7">
      <section className="overflow-hidden rounded-2xl border bg-card">
        <div className="flex flex-wrap items-center gap-4 border-b bg-muted/30 p-6 md:p-8">
          <span className="grid size-14 place-items-center rounded-2xl bg-primary/10 text-primary">
            <Icon className="size-6" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold tracking-[.15em] text-primary uppercase">
              Domain workspace
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight">
              {domain.name}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {domain.description}
            </p>
          </div>
          <span className="rounded-full border bg-background px-3 py-1 text-xs text-muted-foreground">
            {domain.tools.length} registered tools
          </span>
        </div>
        <div className="p-5 md:p-7">
          <div className="mb-4">
            <h2 className="text-sm font-semibold">Tools in this domain</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Tools are independently organized and registered in the workspace
              catalog.
            </p>
          </div>
          {domain.tools.length ? (
            <div className="grid gap-3 md:grid-cols-2">
              {domain.tools.map((tool) => {
                const ToolIcon = tool.icon
                return (
                  <Link key={tool.id} to={tool.href} className="group">
                    <Card className="h-full transition-colors group-hover:border-primary/40 group-hover:bg-primary/[.02]">
                      <CardContent className="flex items-center gap-3 p-4">
                        <span className="grid size-10 place-items-center rounded-xl bg-muted text-foreground">
                          <ToolIcon className="size-4" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="flex flex-wrap items-center gap-2 text-sm font-medium">
                            {tool.name}
                            <ToolAvailabilityBadge
                              availability={tool.availability}
                            />
                          </span>
                          <span className="mt-1 block text-xs text-muted-foreground">
                            {tool.description}
                          </span>
                        </span>
                        <ArrowUpRight className="size-4 shrink-0 text-muted-foreground" />
                      </CardContent>
                    </Card>
                  </Link>
                )
              })}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed bg-muted/20 px-5 py-10 text-center">
              <span className="mx-auto grid size-11 place-items-center rounded-xl bg-background text-muted-foreground">
                <Compass className="size-5" />
              </span>
              <h3 className="mt-3 text-sm font-semibold">
                Your {domain.name.toLowerCase()} toolkit starts here
              </h3>
              <p className="mx-auto mt-1 max-w-md text-xs leading-relaxed text-muted-foreground">
                The domain scaffold is ready. Add a tool folder under{" "}
                <code className="rounded bg-muted px-1 py-0.5">
                  src/domains/{domain.id}/tools
                </code>
                , then register it in the central tool catalog.
              </p>
              <Button asChild variant="outline" size="sm" className="mt-4">
                <Link to="/">
                  <Plus className="size-3.5" />
                  Explore workspace
                </Link>
              </Button>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
