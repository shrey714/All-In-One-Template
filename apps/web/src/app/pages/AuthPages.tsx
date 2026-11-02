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
  Fingerprint,
  Layers3,
  LockKeyhole,
  Sparkles,
  ShieldCheck,
  SlidersHorizontal,
} from "lucide-react"
import { useAuth } from "@/app/providers/AuthProvider"
import { ApiError } from "@/shared/services/auth-api"
import { SystemPageFrame } from "@/shared/components/layout/SystemPageFrame"
import { notify } from "@/shared/services/notifications"
import { branding } from "@/shared/config/orbit-config"
import { domains } from "@/shared/config/registry"

function WorkspaceOverview() {
  return (
    <div className="relative max-w-xl">
      <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1.5 text-[10px] font-semibold tracking-[.16em] text-primary uppercase">
        <Sparkles className="size-3.5" aria-hidden="true" />
        {branding.signIn.eyebrow}
      </div>
      <h1 className="mt-6 max-w-xl text-4xl leading-[1.04] font-semibold tracking-[-.045em] sm:text-5xl xl:text-[3.5rem]">
        {branding.signIn.headline}
      </h1>
      <p className="mt-5 max-w-lg text-sm leading-6 text-muted-foreground sm:text-[15px]">
        {branding.signIn.description}
      </p>
      <div className="relative mt-8 overflow-hidden rounded-2xl border border-border/80 bg-card/70 p-5 shadow-xl shadow-primary/5 backdrop-blur sm:p-6">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,color-mix(in_oklab,var(--border)_36%,transparent)_1px,transparent_1px),linear-gradient(to_bottom,color-mix(in_oklab,var(--border)_36%,transparent)_1px,transparent_1px)] [mask-image:linear-gradient(to_right,black,transparent_88%)] bg-[size:28px_28px] opacity-40"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-20 -right-16 size-64 rounded-full border border-primary/15"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-10 -right-6 size-44 rounded-full border border-primary/20"
        />
        <div className="relative">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-medium tracking-[.16em] text-muted-foreground uppercase">
                Workspace map
              </p>
              <p className="mt-1 text-lg font-semibold tracking-tight">
                One system. Many workflows.
              </p>
            </div>
            <div className="grid size-11 shrink-0 place-items-center rounded-xl border border-primary/20 bg-primary/10 text-primary shadow-lg shadow-primary/10">
              <Layers3 className="size-5" aria-hidden="true" />
            </div>
          </div>
          <div
            className="mt-5 flex flex-wrap gap-2"
            aria-label="Workspace domains"
          >
            {domains.map((domain, index) => (
              <span
                key={domain.id}
                className="inline-flex items-center gap-2 rounded-lg border bg-background/85 px-3 py-2 text-xs font-medium shadow-sm"
              >
                <span
                  className={`size-1.5 rounded-full ${domainDot(index)}`}
                  aria-hidden="true"
                />
                {domain.name}
              </span>
            ))}
          </div>
          <div className="mt-5 flex items-center gap-2 border-t border-border/70 pt-4 text-[11px] text-muted-foreground">
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-500/50 motion-reduce:animate-none" />
              <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
            </span>
            Access, preferences, and tools in one place
          </div>
        </div>
      </div>
      <div className="mt-7 grid grid-cols-1 gap-2 sm:grid-cols-3 sm:gap-3">
        <OverviewRow
          icon={Layers3}
          title="Organized by domain"
          detail="Every tool, in context."
        />
        <OverviewRow
          icon={ShieldCheck}
          title="Managed access"
          detail="Roles set by your admin."
        />
        <OverviewRow
          icon={SlidersHorizontal}
          title="A workspace that fits"
          detail="Your layout, your flow."
        />
      </div>
    </div>
  )
}

function domainDot(index: number) {
  const colors = [
    "bg-violet-500",
    "bg-cyan-500",
    "bg-emerald-500",
    "bg-amber-500",
    "bg-rose-500",
  ]
  return colors[index % colors.length]
}

function OverviewRow({
  icon: Icon,
  title,
  detail,
}: {
  icon: typeof Layers3
  title: string
  detail: string
}) {
  return (
    <div className="flex min-w-0 items-start gap-2.5 rounded-xl border border-border/60 bg-card/45 p-3">
      <span className="grid size-8 shrink-0 place-items-center rounded-lg border border-primary/15 bg-primary/5 text-primary">
        <Icon className="size-4" />
      </span>
      <div className="min-w-0">
        <p className="text-xs font-semibold">{title}</p>
        <p className="mt-1 text-[10px] leading-4 text-muted-foreground">
          {detail}
        </p>
      </div>
    </div>
  )
}

function AuthFrame({
  children,
  headerLabel,
  landing = false,
}: {
  children: ReactNode
  headerLabel: string
  landing?: boolean
}) {
  return (
    <SystemPageFrame
      headerLabel={headerLabel}
      aside={<WorkspaceOverview />}
      footerNote={branding.signIn.footerNote}
      variant={landing ? "landing" : "default"}
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
    <AuthFrame headerLabel="ACCOUNT ACCESS" landing>
      <Card className="relative overflow-hidden rounded-2xl border-border/80 bg-card/90 shadow-2xl shadow-primary/10 backdrop-blur-xl">
        <div
          aria-hidden="true"
          className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary/30 via-primary to-primary/30"
        />
        <CardHeader className="px-6 pt-7 sm:px-7">
          <div className="mb-2 flex items-center gap-2">
            <span className="grid size-8 place-items-center rounded-lg bg-primary/10 text-primary">
              <LockKeyhole className="size-4" aria-hidden="true" />
            </span>
            <p className="text-[10px] font-semibold tracking-[.16em] text-primary uppercase">
              Secure sign-in
            </p>
          </div>
          <CardTitle className="text-2xl tracking-tight">
            {branding.signIn.formTitle}
          </CardTitle>
          <CardDescription className="leading-5">
            {branding.signIn.formDescription}
          </CardDescription>
        </CardHeader>
        <CardContent className="px-6 pb-7 sm:px-7">
          <form className="space-y-4" onSubmit={submit}>
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="orbit-username" className="text-xs">
                Username
              </Label>
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
              <Label htmlFor="orbit-password" className="text-xs">
                Password
              </Label>
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
              className="mt-1 h-11 w-full rounded-lg text-sm font-semibold shadow-md shadow-primary/15"
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
                  <Fingerprint className="size-4" />
                  {branding.signIn.submitLabel}
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
      notify.success(
        "Password updated",
        `Your ${branding.productName} account is ready to use.`
      )
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
