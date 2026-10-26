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
const SystemPageFrame = lazy(() =>
  import("@/shared/components/layout/SystemPageFrame").then((module) => ({
    default: module.SystemPageFrame,
  }))
)

function SystemFrameFallback() {
  return (
    <main className="grid min-h-svh place-items-center bg-background p-6">
      <p className="text-sm font-medium tracking-[.14em] text-muted-foreground uppercase">
        Orbit Workspace
      </p>
    </main>
  )
}

function AuthProgress({
  message = "Checking your Orbit session…",
}: {
  message?: string
}) {
  return (
    <Suspense fallback={<SystemFrameFallback />}>
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
    <Suspense fallback={<SystemFrameFallback />}>
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
  if (user?.role !== "admin") return <Navigate to="/" replace />
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
