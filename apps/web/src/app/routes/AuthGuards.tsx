import type { ReactNode } from "react"
import { Navigate, Outlet, useLocation } from "react-router-dom"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { LoaderCircle, ShieldAlert } from "lucide-react"
import { useAuth } from "@/app/providers/AuthProvider"

function AuthProgress({
  message = "Checking your Orbit session…",
}: {
  message?: string
}) {
  return (
    <main className="grid min-h-svh place-items-center bg-background p-6">
      <div
        className="flex items-center gap-3 text-sm text-muted-foreground"
        role="status"
      >
        <LoaderCircle className="size-4 animate-spin" />
        {message}
      </div>
    </main>
  )
}

function BackendUnavailable() {
  const { refresh } = useAuth()
  return (
    <main className="grid min-h-svh place-items-center bg-background p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldAlert className="size-5 text-destructive" /> Authentication
            service unavailable
          </CardTitle>
          <CardDescription>
            Start the separate backend process, then retry. Your session is not
            stored in browser local storage.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => void refresh()}>Retry connection</Button>
        </CardContent>
      </Card>
    </main>
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
