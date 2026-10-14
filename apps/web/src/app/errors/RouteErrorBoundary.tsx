import { isRouteErrorResponse, useRouteError } from "react-router-dom"
import { Button } from "@workspace/ui/components/button"
export function RouteErrorBoundary() {
  const error = useRouteError()
  const message = isRouteErrorResponse(error) ? `${error.status} · ${error.statusText}` : error instanceof Error ? error.message : "Unexpected route error"
  return <main className="grid min-h-[60vh] place-items-center p-6"><section className="max-w-lg rounded-2xl border bg-card p-8 text-center"><p className="text-xs font-semibold uppercase tracking-widest text-destructive">Workspace error</p><h1 className="mt-2 text-2xl font-semibold">This page could not load</h1><p className="mt-2 break-words text-sm text-muted-foreground">{message}</p><Button className="mt-5" onClick={() => window.location.assign("/")}>Return to workspace</Button></section></main>
}
