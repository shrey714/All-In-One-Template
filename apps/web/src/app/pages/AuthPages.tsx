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
import {
  Check,
  Circle,
  Eye,
  EyeOff,
  KeyRound,
  Layers3,
  ShieldCheck,
  SlidersHorizontal,
} from "lucide-react"
import { useAuth } from "@/app/providers/AuthProvider"
import { ApiError } from "@/shared/services/auth-api"
import { SystemPageFrame } from "@/shared/components/layout/SystemPageFrame"
import { notify } from "@/shared/services/notifications"

function WorkspaceOverview() {
  return (
    <div className="max-w-xl">
      <p className="text-[11px] font-semibold tracking-[.18em] text-primary uppercase">
        Your team’s workspace
      </p>
      <h1 className="mt-4 max-w-lg text-3xl leading-tight font-semibold tracking-tight sm:text-4xl">
        A focused place for the tools behind your work.
      </h1>
      <p className="mt-4 max-w-lg text-sm leading-6 text-muted-foreground">
        Move between domain-specific tools in one organized workspace, with
        access and preferences managed in one place.
      </p>
      <div className="mt-7 flex flex-wrap gap-2" aria-label="Workspace domains">
        {["Finance", "Productivity", "Health", "Developer", "Utilities"].map(
          (domain) => (
            <span
              key={domain}
              className="rounded-md border bg-card px-2.5 py-1.5 text-xs text-muted-foreground"
            >
              {domain}
            </span>
          )
        )}
      </div>
      <div className="mt-9 divide-y border-y">
        <OverviewRow
          number="01"
          icon={Layers3}
          title="Organized by domain"
          detail="Keep related tools easy to find."
        />
        <OverviewRow
          number="02"
          icon={ShieldCheck}
          title="Managed access"
          detail="Accounts and roles are provisioned by an admin."
        />
        <OverviewRow
          number="03"
          icon={SlidersHorizontal}
          title="A workspace that fits"
          detail="Keep your layout and display preferences."
        />
      </div>
    </div>
  )
}

function OverviewRow({
  number,
  icon: Icon,
  title,
  detail,
}: {
  number: string
  icon: typeof Layers3
  title: string
  detail: string
}) {
  return (
    <div className="flex items-start gap-3 py-4">
      <span className="w-6 pt-0.5 font-mono text-[10px] text-muted-foreground">
        {number}
      </span>
      <span className="grid size-8 shrink-0 place-items-center rounded-md border bg-card text-muted-foreground">
        <Icon className="size-4" />
      </span>
      <div className="min-w-0">
        <p className="text-sm font-medium">{title}</p>
        <p className="mt-0.5 text-xs leading-5 text-muted-foreground">
          {detail}
        </p>
      </div>
    </div>
  )
}

function AuthFrame({
  children,
  headerLabel,
}: {
  children: ReactNode
  headerLabel: string
}) {
  return (
    <SystemPageFrame
      headerLabel={headerLabel}
      aside={<WorkspaceOverview />}
      footerNote="Accounts are provisioned by an Orbit administrator."
    >
      {children}
    </SystemPageFrame>
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
    <AuthFrame headerLabel="ACCOUNT ACCESS">
      <Card className="border-border/80 shadow-sm">
        <CardHeader>
          <p className="text-[10px] font-semibold tracking-[.16em] text-primary uppercase">
            Member sign-in
          </p>
          <CardTitle className="text-xl">Welcome back</CardTitle>
          <CardDescription>
            Sign in with the credentials provided by your administrator.
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
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const requiresChange = Boolean(user?.mustChangePassword)
  const meetsPasswordLength = newPassword.length >= 12
  const passwordsMatch =
    confirmPassword.length > 0 && newPassword === confirmPassword

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
      notify.success("Password updated", "Your Orbit account is ready to use.")
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
    <AuthFrame headerLabel="ACCOUNT SECURITY">
      <Card className="border-border/80 shadow-sm">
        <CardHeader>
          <p className="text-[10px] font-semibold tracking-[.16em] text-primary uppercase">
            {requiresChange ? "First sign-in" : "Security settings"}
          </p>
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
                <div className="relative">
                  <Input
                    id="current-password"
                    type={showCurrentPassword ? "text" : "password"}
                    autoComplete="current-password"
                    required
                    className="pr-10"
                    value={currentPassword}
                    onChange={(event) => setCurrentPassword(event.target.value)}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    className="absolute top-1/2 right-1 -translate-y-1/2"
                    onClick={() => setShowCurrentPassword((value) => !value)}
                    aria-label={
                      showCurrentPassword
                        ? "Hide current password"
                        : "Show current password"
                    }
                  >
                    {showCurrentPassword ? <EyeOff /> : <Eye />}
                  </Button>
                </div>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="new-password">New password</Label>
              <div className="relative">
                <Input
                  id="new-password"
                  type={showNewPassword ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  minLength={12}
                  maxLength={128}
                  className="pr-10"
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  className="absolute top-1/2 right-1 -translate-y-1/2"
                  onClick={() => setShowNewPassword((value) => !value)}
                  aria-label={
                    showNewPassword ? "Hide new password" : "Show new password"
                  }
                >
                  {showNewPassword ? <EyeOff /> : <Eye />}
                </Button>
              </div>
              <p
                aria-live="polite"
                className={`flex items-center gap-1.5 text-xs ${meetsPasswordLength ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"}`}
              >
                {meetsPasswordLength ? (
                  <Check className="size-3.5" />
                ) : (
                  <Circle className="size-3.5" />
                )}
                At least 12 characters
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm new password</Label>
              <div className="relative">
                <Input
                  id="confirm-password"
                  type={showConfirmPassword ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  minLength={12}
                  maxLength={128}
                  className="pr-10"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  className="absolute top-1/2 right-1 -translate-y-1/2"
                  onClick={() => setShowConfirmPassword((value) => !value)}
                  aria-label={
                    showConfirmPassword
                      ? "Hide confirmation password"
                      : "Show confirmation password"
                  }
                >
                  {showConfirmPassword ? <EyeOff /> : <Eye />}
                </Button>
              </div>
              {confirmPassword && (
                <p
                  role="status"
                  className={`flex items-center gap-1.5 text-xs ${passwordsMatch ? "text-emerald-600 dark:text-emerald-400" : "text-destructive"}`}
                >
                  {passwordsMatch ? (
                    <Check className="size-3.5" />
                  ) : (
                    <Circle className="size-3.5" />
                  )}
                  {passwordsMatch
                    ? "Passwords match"
                    : "Passwords do not match"}
                </p>
              )}
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
