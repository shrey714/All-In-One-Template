import { useState, type FormEvent, type ReactNode } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { Alert, AlertDescription } from "@workspace/ui/components/alert"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import { Eye, EyeOff, KeyRound, Orbit, ShieldCheck } from "lucide-react"
import { useAuth } from "@/app/providers/AuthProvider"
import { ApiError } from "@/shared/services/auth-api"

function AuthFrame({ children }: { children: ReactNode }) {
  return (
    <main className="orbit-dot-pattern grid min-h-svh place-items-center bg-background px-4 py-10">
      <div className="w-full max-w-md space-y-4">
        <div className="flex items-center justify-center gap-2 text-sm font-semibold tracking-wide">
          <span className="grid size-8 place-items-center rounded-xl bg-primary text-primary-foreground">
            <Orbit className="size-4" />
          </span>
          ORBIT WORKSPACE
        </div>
        {children}
        <p className="text-center text-xs text-muted-foreground">
          Accounts are provisioned by an Orbit administrator.
        </p>
      </div>
    </main>
  )
}

export function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const from = (
    location.state as {
      from?: { pathname?: string; search?: string; hash?: string }
    } | null
  )?.from
  const returnTo = from
    ? `${from.pathname ?? "/"}${from.search ?? ""}${from.hash ?? ""}`
    : "/"

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError("")
    setBusy(true)
    try {
      const user = await login(username, password)
      navigate(user.mustChangePassword ? "/change-password" : returnTo, {
        replace: true,
      })
    } catch (failure) {
      setError(
        failure instanceof Error
          ? failure.message
          : "Sign-in failed. Try again."
      )
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthFrame>
      <Card>
        <CardHeader>
          <CardTitle>Sign in to Orbit</CardTitle>
          <CardDescription>
            Use the username and password provided by your administrator.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={submit}>
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="orbit-username">Username</Label>
              <Input
                id="orbit-username"
                name="username"
                autoComplete="username"
                autoCapitalize="none"
                spellCheck={false}
                required
                minLength={3}
                maxLength={40}
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="orbit-password">Password</Label>
              <div className="relative">
                <Input
                  id="orbit-password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  maxLength={128}
                  className="pr-10"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  className="absolute top-1/2 right-1 -translate-y-1/2"
                  onClick={() => setShowPassword((value) => !value)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff /> : <Eye />}
                </Button>
              </div>
            </div>
            <Button
              className="w-full"
              type="submit"
              disabled={busy || !username || !password}
            >
              {busy ? (
                <>
                  <span className="mr-1.5 size-3 animate-spin rounded-full border-2 border-current border-r-transparent" />
                  Signing in…
                </>
              ) : (
                <>
                  <KeyRound className="size-4" />
                  Sign in
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </AuthFrame>
  )
}

export function ChangePasswordPage() {
  const { user, changePassword } = useAuth()
  const navigate = useNavigate()
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const [done, setDone] = useState(false)
  const requiresChange = Boolean(user?.mustChangePassword)

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError("")
    if (newPassword.length < 12 || newPassword.length > 128) {
      setError("Use a password between 12 and 128 characters.")
      return
    }
    if (newPassword !== confirmPassword) {
      setError("The new passwords do not match.")
      return
    }
    setBusy(true)
    try {
      await changePassword(
        requiresChange ? undefined : currentPassword,
        newPassword
      )
      setDone(true)
      navigate("/", { replace: true })
    } catch (failure) {
      setError(
        failure instanceof ApiError
          ? failure.message
          : "Password update failed. Try again."
      )
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthFrame>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="size-5 text-primary" />
            {requiresChange ? "Set your password" : "Change password"}
          </CardTitle>
          <CardDescription>
            {requiresChange
              ? "Your administrator issued a temporary password. Choose a new password to continue."
              : "Enter your current password and choose a new one."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {done && (
            <Alert className="mb-4">
              <AlertDescription>Password updated.</AlertDescription>
            </Alert>
          )}
          <form className="space-y-4" onSubmit={submit}>
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            {!requiresChange && (
              <div className="space-y-2">
                <Label htmlFor="current-password">Current password</Label>
                <Input
                  id="current-password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={currentPassword}
                  onChange={(event) => setCurrentPassword(event.target.value)}
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="new-password">New password</Label>
              <Input
                id="new-password"
                type="password"
                autoComplete="new-password"
                required
                minLength={12}
                maxLength={128}
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Use at least 12 characters.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm new password</Label>
              <Input
                id="confirm-password"
                type="password"
                autoComplete="new-password"
                required
                minLength={12}
                maxLength={128}
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
              />
            </div>
            <Button className="w-full" type="submit" disabled={busy}>
              {busy
                ? "Updating…"
                : requiresChange
                  ? "Set password and continue"
                  : "Update password"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </AuthFrame>
  )
}
