import { lazy, Suspense, useState, type ReactNode } from "react"
import {
  Link,
  Navigate,
  Outlet,
  useLocation,
  useNavigate,
  useParams,
} from "react-router-dom"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import {
  ArrowLeft,
  LoaderCircle,
  LogOut,
  RotateCw,
  ShieldAlert,
} from "lucide-react"
import { useAuth } from "@/app/providers/AuthProvider"
import { SystemPageLoadingSkeleton } from "@/shared/components/layout/WorkspaceLoadingSkeleton"
import { branding } from "@/shared/config/orbit-config"
import { getDomain } from "@/shared/config/registry"
import {
  canAccessTool,
  canAccessDomain,
  hasDashboardAccess,
  hasPermission,
  type Permission,
} from "@/shared/types/auth"
const SystemPageFrame = lazy(() =>
  import("@/shared/components/layout/SystemPageFrame").then((module) => ({
    default: module.SystemPageFrame,
  }))
)

function AuthProgress({
  message = `Checking your ${branding.shortName} session…`,
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
              Can’t reach {branding.shortName} sign-in
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

function AccessDenied({ permission }: { permission: Permission }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [signingOut, setSigningOut] = useState(false)
  const isDashboardDenied = permission === "dashboard:access"

  const signOutAndSwitch = async () => {
    setSigningOut(true)
    try {
      await logout()
      navigate("/login", { replace: true })
    } catch {
      // The provider clears local identity even if the server cannot be reached.
      navigate("/login", { replace: true })
    } finally {
      setSigningOut(false)
    }
  }

  const content = (
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
          {isDashboardDenied
            ? "You’re signed in, but don’t have workspace access"
            : `Required permission: ${permission}`}
        </h1>
        <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
          {isDashboardDenied
            ? "Your account is active, but no assigned role grants dashboard access. Contact your workspace administrator to request access, or sign out to use another account."
            : "Your account is active, but it does not have the capability needed for this area. Contact a workspace administrator if you need access."}
        </p>
        {isDashboardDenied && user && (
          <p className="mt-4 rounded-md border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
            Signed in as{" "}
            <span className="font-medium text-foreground">
              {user.displayName}
            </span>{" "}
            ({user.username})
          </p>
        )}
        {isDashboardDenied ? (
          <Button
            className="mt-6"
            onClick={() => void signOutAndSwitch()}
            disabled={signingOut}
          >
            <LogOut className="size-4" />
            {signingOut ? "Signing out…" : "Sign out and switch account"}
          </Button>
        ) : (
          <Button className="mt-6" asChild>
            <Link to="/">
              <ArrowLeft className="size-4" /> Return to workspace
            </Link>
          </Button>
        )}
      </CardContent>
    </Card>
  )

  if (isDashboardDenied) {
    return (
      <Suspense fallback={<SystemPageLoadingSkeleton />}>
        <SystemPageFrame
          headerLabel="WORKSPACE ACCESS"
          footerNote="Access is assigned by your workspace administrator."
        >
          <section className="grid min-h-[min(62vh,640px)] place-items-center py-8">
            {content}
          </section>
        </SystemPageFrame>
      </Suspense>
    )
  }

  return (
    <section className="grid min-h-[min(62vh,640px)] place-items-center py-8">
      {content}
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

export function RequirePermission({
  children,
  permission,
}: {
  children: ReactNode
  permission: Permission
}) {
  const { user, authEnabled } = useAuth()
  if (!authEnabled)
    return permission === "dashboard:access" || permission === "tools:use" ? (
      children
    ) : (
      <Navigate to="/" replace />
    )
  if (!user) return <Navigate to="/login" replace />
  if (!hasPermission(user, permission))
    return <AccessDenied permission={permission} />
  return children
}

export function RequireToolAccess({ children }: { children: ReactNode }) {
  const { domainId = "", toolId = "" } = useParams()
  const { user, authEnabled } = useAuth()
  if (!authEnabled) return children
  if (!user) return <Navigate to="/login" replace />
  if (!hasDashboardAccess(user))
    return <AccessDenied permission="dashboard:access" />
  if (!canAccessTool(user, domainId, toolId))
    return <AccessDenied permission={`tool:${domainId}/${toolId}:access`} />
  return children
}

export function RequireDomainAccess({ children }: { children: ReactNode }) {
  const { domainId = "" } = useParams()
  const { user, authEnabled } = useAuth()
  if (!authEnabled) return children
  if (!user) return <Navigate to="/login" replace />
  if (!hasDashboardAccess(user))
    return <AccessDenied permission="dashboard:access" />
  const domain = getDomain(domainId)
  if (
    !domain ||
    !canAccessDomain(
      user,
      domainId,
      domain.tools.map((tool) => tool.id)
    )
  )
    return <AccessDenied permission={`domain:${domainId}:access`} />
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
