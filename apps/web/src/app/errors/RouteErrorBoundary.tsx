import { lazy, Suspense } from "react"
import { isRouteErrorResponse, Link, useRouteError } from "react-router-dom"
import { Button } from "@workspace/ui/components/button"
import { AlertTriangle, ArrowLeft, Home, RotateCw } from "lucide-react"
import { SystemPageLoadingSkeleton } from "@/shared/components/layout/WorkspaceLoadingSkeleton"

const SystemPageFrame = lazy(() =>
  import("@/shared/components/layout/SystemPageFrame").then((module) => ({
    default: module.SystemPageFrame,
  }))
)

export function RouteErrorBoundary() {
  const error = useRouteError()
  const message = isRouteErrorResponse(error)
    ? `${error.status} · ${error.statusText}`
    : error instanceof Error
      ? error.message
      : "Unexpected route error"

  return (
    <Suspense fallback={<SystemPageLoadingSkeleton />}>
      <SystemPageFrame
        headerLabel="WORKSPACE STATUS"
        footerNote="If the problem persists, contact your Orbit administrator."
      >
        <section className="rounded-xl border bg-card p-7 shadow-sm sm:p-8">
          <span className="grid size-10 place-items-center rounded-lg border border-destructive/20 bg-destructive/5 text-destructive">
            <AlertTriangle className="size-5" />
          </span>
          <p className="mt-5 text-[10px] font-semibold tracking-[.16em] text-destructive uppercase">
            Route error
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">
            This page couldn’t load
          </h1>
          <p className="mt-2 text-sm leading-6 break-words text-muted-foreground">
            Something interrupted this page. Retry it, or return to the
            workspace and continue from there.
          </p>
          <details className="mt-5 rounded-md border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
            <summary className="cursor-pointer font-medium text-foreground">
              Technical details
            </summary>
            <p className="mt-2 font-mono break-words">{message}</p>
          </details>
          <div className="mt-6 flex flex-wrap gap-2">
            <Button onClick={() => window.location.reload()}>
              <RotateCw className="size-4" /> Retry page
            </Button>
            <Button variant="outline" asChild>
              <Link to="/">
                <Home className="size-4" /> Go to workspace
              </Link>
            </Button>
            <Button variant="ghost" onClick={() => window.history.back()}>
              <ArrowLeft className="size-4" /> Go back
            </Button>
          </div>
        </section>
      </SystemPageFrame>
    </Suspense>
  )
}
