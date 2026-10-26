import { lazy, Suspense, type ReactNode } from "react"
import { Link, Navigate, Outlet, useLocation } from "react-router-dom"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { ArrowLeft, LoaderCircle, RotateCw, ShieldAlert } from "lucide-react"
import { useAuth } from "@/app/providers/AuthProvider"
import { SystemPageLoadingSkeleton } from "@/shared/components/layout/WorkspaceLoadingSkeleton"
const SystemPageFrame = lazy(() =>
  import("@/shared/components/layout/SystemPageFrame").then((module) => ({
    default: module.SystemPageFrame,
  }))
)

function AuthProgress({
  message = "Checking your Orbit session…",
}: {
  message?: string
}) {
  return (
    <Suspense fallback={<SystemPageLoadingSkeleton />}>
      <SystemPageFrame
        headerLabel="SECURE WORKSPACE"
        footerNote="Preparing your secure workspace…"
      >
        <section
          className="rounded-xl border bg-card p-7 shadow-sm"
          role="status"
          aria-live="polite"
        >
          <span className="grid size-10 place-items-center rounded-lg border bg-muted/60 text-primary">
            <LoaderCircle className="size-5 animate-spin" />
          </span>
          <h1 className="mt-5 text-lg font-semibold tracking-tight">
            Checking your session
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">{message}</p>
          <div className="mt-6 h-1 overflow-hidden rounded-full bg-muted">
            <div className="h-full w-1/3 animate-pulse rounded-full bg-primary/70" />
          </div>
        </section>
      </SystemPageFrame>
    </Suspense>
  )
}

function BackendUnavailable() {
  const { refresh } = useAuth()
  return (
    <Suspense fallback={<SystemPageLoadingSkeleton />}>
      <SystemPageFrame
        headerLabel="CONNECTION STATUS"
        footerNote="Your sign-in credentials are never stored in browser local storage."
      >
        <Card className="border-border/80 shadow-sm">
          <CardHeader>
            <span className="grid size-10 place-items-center rounded-lg border border-destructive/20 bg-destructive/5 text-destructive">
              <ShieldAlert className="size-5" />
            </span>
            <CardTitle className="pt-1 text-xl">
              Can’t reach Orbit sign-in
            </CardTitle>
            <CardDescription>
              The authentication service did not respond. Check that the
              separate backend process is running, then try again.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Button onClick={() => void refresh()}>
              <RotateCw className="size-4" /> Retry connection
            </Button>
            <Button variant="outline" asChild>
              <Link to="/login">
                <ArrowLeft className="size-4" /> Back to sign in
              </Link>
            </Button>
          </CardContent>
        </Card>
      </SystemPageFrame>
    </Suspense>
  )
}

function AccessDenied() {
  return (
    <section className="grid min-h-[min(62vh,640px)] place-items-center py-8">
      <Card className="w-full max-w-xl overflow-hidden border-amber-500/25">
        <div className="h-1.5 bg-amber-500" />
        <CardContent className="flex flex-col items-center px-6 py-10 text-center sm:px-10">
          <span className="grid size-14 place-items-center rounded-2xl border border-amber-500/25 bg-amber-500/10 text-amber-600 dark:text-amber-400">
            <ShieldAlert className="size-6" aria-hidden="true" />
          </span>
          <p className="mt-4 text-xs font-semibold tracking-widest text-amber-700 uppercase dark:text-amber-400">
            Access control · 403
          </p>
          <h1 className="mt-2 text-xl font-semibold tracking-tight">
            Administrator access required
          </h1>
          <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
            This area is reserved for workspace administrators. Your account is
            still active; contact an administrator if you need user-management
            access.
          </p>
          <Button className="mt-6" asChild>
            <Link to="/">
              <ArrowLeft className="size-4" /> Return to workspace
            </Link>
          </Button>
        </CardContent>
      </Card>
    </section>
  )
}

export function RequireAuth({ children }: { children?: ReactNode }) {
  const { status, user, authEnabled } = useAuth()
  const location = useLocation()
  if (!authEnabled) return children ?? <Outlet />
  if (status === "loading") return <AuthProgress />
  if (status === "error") return <BackendUnavailable />
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />
  if (user.mustChangePassword && location.pathname !== "/change-password") {
    return <Navigate to="/change-password" replace />
  }
  return children ?? <Outlet />
}

export function RequireSignedIn({ children }: { children: ReactNode }) {
  const { status, user, authEnabled } = useAuth()
  if (!authEnabled) return <Navigate to="/" replace />
  if (status === "loading") return <AuthProgress />
  if (status === "error") return <BackendUnavailable />
  if (!user) return <Navigate to="/login" replace />
  return children
}

export function RequireAdmin({ children }: { children: ReactNode }) {
  const { user, authEnabled } = useAuth()
  if (!authEnabled) return <Navigate to="/" replace />
  if (!user) return <Navigate to="/login" replace />
  if (user.role !== "admin") return <AccessDenied />
  return children
}

export function LoginRedirect({ children }: { children: ReactNode }) {
  const { status, user, authEnabled } = useAuth()
  if (!authEnabled) return <Navigate to="/" replace />
  if (status === "loading") return <AuthProgress />
  if (status === "error") return <BackendUnavailable />
  if (user?.mustChangePassword)
    return <Navigate to="/change-password" replace />
  if (user) return <Navigate to="/" replace />
  return children
}
