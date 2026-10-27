import { useCallback, useEffect, useState, type FormEvent } from "react"
import { Alert, AlertDescription } from "@workspace/ui/components/alert"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import { KeyRound, RefreshCw, ShieldCheck, UserPlus, Users } from "lucide-react"
import { useAuth } from "@/app/providers/AuthProvider"
import { requestApi } from "@/shared/services/auth-api"
import type { AccessRole, ManagedUser } from "@/shared/types/auth"
import { notify } from "@/shared/services/notifications"
import { branding } from "@/shared/config/orbit-config"
import { hasPermission } from "@/shared/types/auth"

export function AdminUsersPage() {
  const { user: currentUser } = useAuth()
  const canCreateUsers = hasPermission(currentUser, "users:create")
  const canManageRoles = hasPermission(currentUser, "users:assign-roles")
  const canReadRoles =
    canManageRoles || hasPermission(currentUser, "roles:read")
  const canManageAccess = hasPermission(currentUser, "users:manage-access")
  const canResetCredentials = hasPermission(
    currentUser,
    "users:reset-credentials"
  )
  const [users, setUsers] = useState<ManagedUser[]>([])
  const [roles, setRoles] = useState<AccessRole[]>([])
  const [roleDrafts, setRoleDrafts] = useState<Record<number, string[]>>({})
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<number | null>(null)
  const [error, setError] = useState("")
  const [notice, setNotice] = useState("")
  const [username, setUsername] = useState("")
  const [displayName, setDisplayName] = useState("")
  const [temporaryPassword, setTemporaryPassword] = useState("")
  const [newRoleIds, setNewRoleIds] = useState<string[]>([])
  const [createdCredential, setCreatedCredential] = useState<{
    username: string
    password: string
  } | null>(null)
  const [resetTarget, setResetTarget] = useState<ManagedUser | null>(null)
  const [resetPassword, setResetPassword] = useState("")

  const loadUsers = useCallback(async () => {
    try {
      const result = await requestApi<{ users: ManagedUser[] }>(
        "/api/admin/users"
      )
      setUsers(result.users)
      setRoleDrafts(
        Object.fromEntries(
          result.users.map((item) => [
            item.id,
            item.roles.map((role) => role.id),
          ])
        )
      )
      if (canReadRoles) {
        const roleResult = await requestApi<{ roles: AccessRole[] }>(
          "/api/admin/roles"
        )
        setRoles(roleResult.roles)
      }
    } catch (failure) {
      setError(
        failure instanceof Error ? failure.message : "Could not load users."
      )
    } finally {
      setLoading(false)
    }
  }, [canReadRoles])

  useEffect(() => {
    // Fetches over the network before state changes; this is not a synchronous cascading update.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadUsers()
  }, [loadUsers])

  const refreshUsers = () => {
    setLoading(true)
    setError("")
    void loadUsers()
  }

  const createUser = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError("")
    setNotice("")
    if (temporaryPassword.length < 12) {
      setError("Temporary password must be at least 12 characters.")
      return
    }
    setBusyId(-1)
    try {
      const result = await requestApi<{ user: ManagedUser }>(
        "/api/admin/users",
        {
          method: "POST",
          body: JSON.stringify({
            username,
            displayName: displayName || username,
            roleIds: canManageRoles ? newRoleIds : [],
            temporaryPassword,
          }),
        }
      )
      setUsers((items) => [result.user, ...items])
      setRoleDrafts((items) => ({
        ...items,
        [result.user.id]: result.user.roles.map((role) => role.id),
      }))
      setCreatedCredential({
        username: result.user.username,
        password: temporaryPassword,
      })
      setUsername("")
      setDisplayName("")
      setTemporaryPassword("")
      setNewRoleIds([])
      setNotice(
        `Created ${result.user.username}. Share the temporary password using a trusted channel; ${branding.shortName} will require a change at first sign-in.`
      )
      notify.success(
        "User provisioned",
        `${result.user.username} can sign in after changing the temporary password.`
      )
    } catch (failure) {
      setError(
        failure instanceof Error ? failure.message : "Could not create user."
      )
    } finally {
      setBusyId(null)
    }
  }

  const updateRole = async (target: ManagedUser) => {
    const roleIds = roleDrafts[target.id] ?? []
    const previousRoleIds = target.roles.map((role) => role.id).sort()
    if (roleIds.slice().sort().join("|") === previousRoleIds.join("|")) return
    setError("")
    setNotice("")
    setBusyId(target.id)
    try {
      await requestApi<{ roles: AccessRole[] }>(
        `/api/admin/users/${target.id}/roles`,
        {
          method: "PATCH",
          body: JSON.stringify({ roleIds }),
        }
      )
      await loadUsers()
      setNotice(`Access roles updated for ${target.username}.`)
      notify.success(
        "Access roles updated",
        `The new grants for ${target.username} are now active.`
      )
    } catch (failure) {
      setError(
        failure instanceof Error ? failure.message : "Could not update role."
      )
    } finally {
      setBusyId(null)
    }
  }

  const updateActive = async (target: ManagedUser) => {
    setError("")
    setNotice("")
    setBusyId(target.id)
    try {
      const result = await requestApi<{ user: ManagedUser }>(
        `/api/admin/users/${target.id}/active`,
        {
          method: "PATCH",
          body: JSON.stringify({ isActive: !target.isActive }),
        }
      )
      setUsers((items) =>
        items.map((item) => (item.id === target.id ? result.user : item))
      )
      setNotice(
        `${target.username} ${result.user.isActive ? "activated" : "deactivated"}.`
      )
      notify.success(
        result.user.isActive ? "Account activated" : "Account deactivated",
        `${target.username} ${result.user.isActive ? "can sign in again." : "can no longer sign in."}`
      )
    } catch (failure) {
      setError(
        failure instanceof Error
          ? failure.message
          : "Could not update account status."
      )
    } finally {
      setBusyId(null)
    }
  }

  const submitReset = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!resetTarget) return
    setError("")
    setBusyId(resetTarget.id)
    try {
      await requestApi<void>(
        `/api/admin/users/${resetTarget.id}/temporary-password`,
        {
          method: "POST",
          body: JSON.stringify({ temporaryPassword: resetPassword }),
        }
      )
      setCreatedCredential({
        username: resetTarget.username,
        password: resetPassword,
      })
      setNotice(
        `Password reset for ${resetTarget.username}. They must choose a new password at next sign-in.`
      )
      notify.success(
        "Temporary password reset",
        `${resetTarget.username} will be asked to choose a new password at next sign-in.`
      )
      setResetTarget(null)
      setResetPassword("")
    } catch (failure) {
      setError(
        failure instanceof Error ? failure.message : "Could not reset password."
      )
    } finally {
      setBusyId(null)
    }
  }

  const copyTemporaryCredential = async () => {
    if (!createdCredential) return
    try {
      await navigator.clipboard.writeText(createdCredential.password)
      notify.success(
        "Temporary password copied",
        "Share it only through a trusted channel."
      )
    } catch {
      notify.error(
        "Could not copy password",
        "Check clipboard permissions, then select and copy the password manually."
      )
    }
  }

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      <header className="space-y-2">
        <p className="text-xs font-medium tracking-[.15em] text-primary uppercase">
          Administration / Access control
        </p>
        <div className="flex items-center gap-2">
          <Users className="size-5 text-primary" />
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
            Users & access
          </h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Provision accounts, assign one or more access roles, and control
          active access. Accounts without a dashboard-access role can sign in
          but cannot enter the workspace.
        </p>
      </header>

      <div
        className={`grid gap-5 ${canCreateUsers ? "xl:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]" : "grid-cols-1"}`}
      >
        {canCreateUsers && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="size-4" />
                Provision a user
              </CardTitle>
              <CardDescription>
                There is no public sign-up. New accounts receive a temporary
                password and must change it before using {branding.shortName}.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form
                className="space-y-4"
                onSubmit={(event) => void createUser(event)}
              >
                <div className="space-y-2">
                  <Label htmlFor="new-username">Username</Label>
                  <Input
                    id="new-username"
                    required
                    minLength={3}
                    maxLength={40}
                    pattern="[A-Za-z0-9._-]{3,40}"
                    autoCapitalize="none"
                    autoComplete="off"
                    value={username}
                    onChange={(event) => setUsername(event.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    3–40 letters, numbers, dots, dashes, or underscores.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-display-name">Display name</Label>
                  <Input
                    id="new-display-name"
                    maxLength={80}
                    value={displayName}
                    onChange={(event) => setDisplayName(event.target.value)}
                    placeholder="Optional; defaults to username"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-temporary-password">
                    Temporary password
                  </Label>
                  <Input
                    id="new-temporary-password"
                    type="password"
                    required
                    minLength={12}
                    maxLength={128}
                    autoComplete="new-password"
                    value={temporaryPassword}
                    onChange={(event) =>
                      setTemporaryPassword(event.target.value)
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    At least 12 characters; shown once after provisioning so you
                    can share it securely.
                  </p>
                </div>
                {canManageRoles && (
                  <fieldset className="space-y-2">
                    <legend className="text-sm font-medium">
                      Initial access roles
                    </legend>
                    <p className="text-xs text-muted-foreground">
                      Leave empty for a provisioned account with no dashboard
                      access.
                    </p>
                    <div className="max-h-40 space-y-1 overflow-y-auto rounded-lg border p-2">
                      {roles
                        .filter((role) => role.isAssignable)
                        .map((role) => (
                          <label
                            key={role.id}
                            className="flex cursor-pointer items-start gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted/60"
                          >
                            <input
                              type="checkbox"
                              className="mt-0.5 accent-primary"
                              checked={newRoleIds.includes(role.id)}
                              onChange={(event) =>
                                setNewRoleIds((ids) =>
                                  event.target.checked
                                    ? [...ids, role.id]
                                    : ids.filter((id) => id !== role.id)
                                )
                              }
                            />
                            <span className="min-w-0">
                              <span className="block font-medium">
                                {role.name}
                              </span>
                              <span className="block text-xs text-muted-foreground">
                                {role.description ||
                                  `${role.grants.length} grants`}
                              </span>
                            </span>
                          </label>
                        ))}
                    </div>
                  </fieldset>
                )}
                <Button
                  className="w-full"
                  type="submit"
                  disabled={busyId === -1}
                >
                  <UserPlus className="size-4" />
                  {busyId === -1 ? "Provisioning…" : "Provision account"}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-3">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <ShieldCheck className="size-4" />
                  Existing accounts
                </CardTitle>
                <CardDescription>
                  Each account action requires its matching capability, enforced
                  by the backend on every protected request.
                </CardDescription>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={refreshUsers}
                disabled={loading}
              >
                <RefreshCw
                  className={`size-3.5 ${loading ? "animate-spin" : ""}`}
                />
                Refresh
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p
                className="py-8 text-center text-sm text-muted-foreground"
                role="status"
              >
                Loading users…
              </p>
            ) : users.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No users found.
              </p>
            ) : (
              <div className="space-y-2">
                {users.map((item) => {
                  const self = item.id === currentUser?.id
                  const selectedRoleIds =
                    roleDrafts[item.id] ?? item.roles.map((role) => role.id)
                  const roleIdsChanged =
                    selectedRoleIds.slice().sort().join("|") !==
                    item.roles
                      .map((role) => role.id)
                      .sort()
                      .join("|")
                  return (
                    <div key={item.id} className="rounded-xl border p-3">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">
                            {item.displayName}
                            {self ? (
                              <span className="ml-2 text-xs text-muted-foreground">
                                You
                              </span>
                            ) : null}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">
                            @{item.username} ·{" "}
                            {item.roles.map((role) => role.name).join(", ") ||
                              "No assigned roles"}{" "}
                            · Added{" "}
                            {new Date(item.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${item.isActive ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" : "bg-muted text-muted-foreground"}`}
                        >
                          {item.isActive ? "Active" : "Inactive"}
                        </span>
                      </div>
                      <div className="mt-3 flex flex-wrap items-end gap-2">
                        {canManageRoles && (
                          <>
                            <fieldset
                              className="flex min-w-0 flex-1 flex-wrap gap-1.5"
                              disabled={self || busyId === item.id}
                            >
                              <legend className="sr-only">
                                Access roles for {item.username}
                              </legend>
                              {roles
                                .filter((role) => role.isAssignable)
                                .map((role) => (
                                  <label
                                    key={role.id}
                                    className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border px-2 py-1 text-xs text-muted-foreground hover:bg-muted/50"
                                  >
                                    <input
                                      type="checkbox"
                                      className="accent-primary"
                                      checked={selectedRoleIds.includes(
                                        role.id
                                      )}
                                      onChange={(event) =>
                                        setRoleDrafts((drafts) => ({
                                          ...drafts,
                                          [item.id]: event.target.checked
                                            ? [...selectedRoleIds, role.id]
                                            : selectedRoleIds.filter(
                                                (id) => id !== role.id
                                              ),
                                        }))
                                      }
                                    />
                                    {role.name}
                                  </label>
                                ))}
                            </fieldset>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              disabled={
                                self || busyId === item.id || !roleIdsChanged
                              }
                              onClick={() => void updateRole(item)}
                            >
                              Save role
                            </Button>
                          </>
                        )}
                        {!self && canResetCredentials && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={busyId === item.id}
                            onClick={() => {
                              setResetTarget(item)
                              setResetPassword("")
                            }}
                          >
                            <KeyRound className="size-3.5" />
                            Reset password
                          </Button>
                        )}
                        {!self && canManageAccess && (
                          <Button
                            type="button"
                            variant={item.isActive ? "destructive" : "outline"}
                            size="sm"
                            disabled={busyId === item.id}
                            onClick={() => void updateActive(item)}
                          >
                            {item.isActive ? "Deactivate" : "Activate"}
                          </Button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {notice && (
        <Alert>
          <AlertDescription className="space-y-2">
            <p>{notice}</p>
            {createdCredential && (
              <div className="flex flex-wrap items-center gap-2">
                <code className="rounded bg-muted px-2 py-1 font-mono text-xs">
                  {createdCredential.username}: {createdCredential.password}
                </code>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => void copyTemporaryCredential()}
                >
                  Copy temporary password
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setCreatedCredential(null)}
                >
                  Hide
                </Button>
              </div>
            )}
          </AlertDescription>
        </Alert>
      )}

      <Dialog
        open={Boolean(resetTarget)}
        onOpenChange={(open) => {
          if (!open) {
            setResetTarget(null)
            setResetPassword("")
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Issue temporary password</DialogTitle>
            <DialogDescription>
              For @{resetTarget?.username}. Their existing sessions will be
              revoked, and they must change this temporary password at next
              sign-in.
            </DialogDescription>
          </DialogHeader>
          <form
            className="space-y-4"
            onSubmit={(event) => void submitReset(event)}
          >
            <div className="space-y-2">
              <Label htmlFor="reset-temporary-password">
                Temporary password
              </Label>
              <Input
                id="reset-temporary-password"
                type="password"
                autoComplete="new-password"
                minLength={12}
                maxLength={128}
                required
                value={resetPassword}
                onChange={(event) => setResetPassword(event.target.value)}
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setResetTarget(null)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={busyId === resetTarget?.id}>
                {busyId === resetTarget?.id
                  ? "Resetting…"
                  : "Issue temporary password"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
