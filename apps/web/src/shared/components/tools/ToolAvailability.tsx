import {
  AlertCircle,
  ArrowUpRight,
  Clock3,
  Construction,
  ExternalLink,
  LockKeyhole,
  Settings2,
  Sparkles,
  Wrench,
  XCircle,
} from "lucide-react"
import { Link } from "react-router-dom"
import { Button } from "@workspace/ui/components/button"
import { Card, CardContent } from "@workspace/ui/components/card"
import type {
  ToolAvailability,
  ToolAvailabilityState,
} from "@/shared/types/tool"

const statusInfo: Record<
  ToolAvailabilityState,
  {
    label: string
    title: string
    detail: string
    icon: typeof AlertCircle
    tone: string
  }
> = {
  preview: {
    label: "Preview",
    title: "Preview feature",
    detail: "This tool is available as a preview and may change.",
    icon: Sparkles,
    tone: "border-violet-500/20 bg-violet-500/10 text-violet-700 dark:text-violet-300",
  },
  "coming-soon": {
    label: "Coming soon",
    title: "This tool is coming soon",
    detail: "This tool is being prepared and is not available yet.",
    icon: Construction,
    tone: "border-sky-500/20 bg-sky-500/10 text-sky-700 dark:text-sky-300",
  },
  maintenance: {
    label: "Maintenance",
    title: "Under maintenance",
    detail:
      "This tool is temporarily offline while maintenance is in progress.",
    icon: Wrench,
    tone: "border-amber-500/20 bg-amber-500/10 text-amber-800 dark:text-amber-300",
  },
  "temporarily-unavailable": {
    label: "Unavailable",
    title: "Temporarily unavailable",
    detail: "The tool cannot be used right now. Please try again later.",
    icon: Clock3,
    tone: "border-orange-500/20 bg-orange-500/10 text-orange-800 dark:text-orange-300",
  },
  "configuration-required": {
    label: "Setup required",
    title: "Setup is required",
    detail: "Complete the required configuration before using this tool.",
    icon: Settings2,
    tone: "border-blue-500/20 bg-blue-500/10 text-blue-700 dark:text-blue-300",
  },
  "access-required": {
    label: "Access required",
    title: "Access is required",
    detail: "You need permission to use this tool.",
    icon: LockKeyhole,
    tone: "border-amber-500/20 bg-amber-500/10 text-amber-800 dark:text-amber-300",
  },
  disabled: {
    label: "Disabled",
    title: "This tool is disabled",
    detail: "This tool has been turned off by workspace configuration.",
    icon: XCircle,
    tone: "border-muted bg-muted/60 text-muted-foreground",
  },
  deprecated: {
    label: "Deprecated",
    title: "Scheduled for retirement",
    detail: "This tool remains available, but is planned for retirement.",
    icon: AlertCircle,
    tone: "border-amber-500/20 bg-amber-500/10 text-amber-800 dark:text-amber-300",
  },
  error: {
    label: "Issue",
    title: "This tool needs attention",
    detail: "The tool has been disabled because of a known issue.",
    icon: AlertCircle,
    tone: "border-destructive/25 bg-destructive/10 text-destructive",
  },
}
const blockedStates = new Set<ToolAvailabilityState>([
  "coming-soon",
  "maintenance",
  "temporarily-unavailable",
  "configuration-required",
  "access-required",
  "disabled",
  "error",
])

export function isToolBlocked(state: ToolAvailabilityState) {
  return blockedStates.has(state)
}

export function ToolAvailabilityBadge({
  availability,
}: {
  availability?: ToolAvailability
}) {
  if (!availability) return null
  const info = statusInfo[availability.state]
  const Icon = info.icon
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-1.5 py-0.5 text-[9px] leading-3 font-medium ${info.tone}`}
      title={availability.message || info.title}
    >
      <Icon className="size-2.5" aria-hidden="true" />
      {info.label}
    </span>
  )
}

export function ToolAvailabilityPage({
  toolName,
  availability,
}: {
  toolName: string
  availability: ToolAvailability
}) {
  const info = statusInfo[availability.state]
  const Icon = info.icon
  const canRetry =
    availability.state === "temporarily-unavailable" ||
    availability.state === "error"
  return (
    <div className="grid min-h-[min(62vh,640px)] place-items-center py-8">
      <Card className="w-full max-w-xl overflow-hidden shadow-sm">
        <div
          className={`h-1.5 w-full ${availability.state === "error" ? "bg-destructive" : availability.state === "maintenance" || availability.state === "deprecated" ? "bg-amber-500" : availability.state === "coming-soon" ? "bg-sky-500" : "bg-primary"}`}
        />
        <CardContent className="flex flex-col items-center px-6 py-10 text-center sm:px-10">
          <span
            className={`grid size-14 place-items-center rounded-2xl border mb-2 ${info.tone}`}
          >
            <Icon className="size-6" aria-hidden="true" />
          </span>
          <ToolAvailabilityBadge availability={availability} />
          <h2 className="mt-4 text-xl font-semibold tracking-tight">
            {toolName}: {info.title}
          </h2>
          <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
            {availability.message || info.detail}
          </p>
          {availability.expectedAt && (
            <p className="mt-3 text-xs text-muted-foreground">
              Expected availability: <time>{availability.expectedAt}</time>
            </p>
          )}
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            {availability.actionHref && availability.actionLabel ? (
              <Button asChild>
                <a href={availability.actionHref}>
                  <ExternalLink />
                  {availability.actionLabel}
                </a>
              </Button>
            ) : canRetry ? (
              <Button onClick={() => window.location.reload()}>
                <Clock3 />
                Try again
              </Button>
            ) : null}
            <Button
              variant={
                availability.actionHref || canRetry ? "outline" : "default"
              }
              asChild
            >
              <Link to="/">
                <ArrowUpRight />
                Back to workspace
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
