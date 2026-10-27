import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react"
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
import { domains } from "@/shared/config/registry"
import { requestApi } from "@/shared/services/auth-api"
import { notify } from "@/shared/services/notifications"
import { useAuth } from "@/app/providers/AuthProvider"
import { hasPermission, type AccessRole } from "@/shared/types/auth"
import { Plus, RefreshCw, ShieldCheck, Trash2 } from "lucide-react"

const globalGrants = [
  ["dashboard:access", "Enter the dashboard"],
  ["tools:use", "Use all registered tools"],
  ["preferences:manage-own", "Manage personal preferences"],
  ["users:read", "View managed users"],
  ["users:create", "Provision accounts"],
  ["users:assign-roles", "Assign roles to other accounts"],
  ["users:manage-access", "Activate or deactivate accounts"],
  ["users:reset-credentials", "Issue temporary passwords"],
  ["roles:read", "View access roles"],
  ["roles:manage", "Create, edit, and delete access roles"],
] as const

const identifier = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/

export function AdminRolesPage() {
  const { user } = useAuth()
  const canManage = hasPermission(user, "roles:manage")
  const canGrant = (grant: string) =>
    hasPermission(user, "*") || hasPermission(user, grant)
  const [roles, setRoles] = useState<AccessRole[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [editingId, setEditingId] = useState<string | null>(null)
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [selectedGrants, setSelectedGrants] = useState<string[]>([])
  const [featureDomain, setFeatureDomain] = useState(domains[0]?.id ?? "")
  const [featureTool, setFeatureTool] = useState(domains[0]?.tools[0]?.id ?? "")
  const [featureId, setFeatureId] = useState("")
  const [featureAction, setFeatureAction] = useState("view")

  const loadRoles = useCallback(async () => {
    try {
      const result = await requestApi<{ roles: AccessRole[] }>(
        "/api/admin/roles"
      )
      setRoles(result.roles)
    } catch (failure) {
      setError(
        failure instanceof Error
          ? failure.message
          : "Could not load access roles."
      )
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    // Initial role data is fetched asynchronously before any state update.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadRoles()
  }, [loadRoles])

  const selectedDomain = domains.find((domain) => domain.id === featureDomain)
  const featureTools = selectedDomain?.tools ?? []
  const allScopedGrants = useMemo(
    () => [
      ...domains.flatMap((domain) => [
        {
          key: `domain:${domain.id}:access`,
          label: `${domain.name} · all tools`,
        },
        ...domain.tools.map((tool) => ({
          key: `tool:${domain.id}/${tool.id}:access`,
          label: `${domain.name} · ${tool.name}`,
        })),
      ]),
    ],
    []
  )

  const resetForm = () => {
    setEditingId(null)
    setName("")
    setDescription("")
    setSelectedGrants([])
    setError("")
  }

  const editRole = (role: AccessRole) => {
    if (!role.isAssignable) return
    if (role.grants.some((grant) => grant !== "*" && !canGrant(grant))) {
      setError(
        "This role contains grants beyond your own access and cannot be edited by your account."
      )
      return
    }
    setEditingId(role.id)
    setName(role.name)
    setDescription(role.description)
    setSelectedGrants(role.grants.filter((grant) => grant !== "*"))
    setError("")
  }

  const toggleGrant = (grant: string) => {
    setSelectedGrants((current) =>
      current.includes(grant)
        ? current.filter((item) => item !== grant)
        : [...current, grant]
    )
  }

  const addFeatureGrant = () => {
    if (
      !identifier.test(featureDomain) ||
      !identifier.test(featureTool) ||
      !identifier.test(featureId) ||
      !identifier.test(featureAction)
    ) {
      setError(
        "Feature, action, domain, and tool identifiers must use lowercase letters, numbers, and hyphens, and start with a letter."
      )
      return
    }
    const grant = `feature:${featureDomain}/${featureTool}/${featureId}:${featureAction}`
    if (!canGrant(grant)) {
      setError(
        "You can only define feature grants that your own account already holds."
      )
      return
    }
    setSelectedGrants((current) =>
      current.includes(grant) ? current : [...current, grant]
    )
    setError("")
    setFeatureId("")
  }

  const saveRole = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!canManage) return
    setSaving(true)
    setError("")
    try {
      const result = await requestApi<{ role: AccessRole }>(
        editingId
          ? `/api/admin/roles/${encodeURIComponent(editingId)}`
          : "/api/admin/roles",
        {
          method: editingId ? "PATCH" : "POST",
          body: JSON.stringify({ name, description, grants: selectedGrants }),
        }
      )
      notify.success(
        editingId ? "Role updated" : "Role created",
        `${result.role.name} now grants ${result.role.grants.length} permission${result.role.grants.length === 1 ? "" : "s"}.`
      )
      resetForm()
      await loadRoles()
    } catch (failure) {
      setError(
        failure instanceof Error
          ? failure.message
          : "Could not save access role."
      )
    } finally {
      setSaving(false)
    }
  }

  const deleteRole = async (role: AccessRole) => {
    if (
      !canManage ||
      role.isBuiltIn ||
      !window.confirm(`Delete the role “${role.name}”? This cannot be undone.`)
    )
      return
    setError("")
    try {
      await requestApi<void>(
        `/api/admin/roles/${encodeURIComponent(role.id)}`,
        { method: "DELETE" }
      )
      notify.success("Role deleted", `${role.name} was removed.`)
      if (editingId === role.id) resetForm()
      await loadRoles()
    } catch (failure) {
      setError(
        failure instanceof Error ? failure.message : "Could not delete role."
      )
    }
  }

  const toolOptionsForFeature = featureTools.length
    ? featureTools
    : (selectedDomain?.tools ?? [])

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <header className="space-y-2">
        <p className="text-xs font-medium tracking-[.15em] text-primary uppercase">
          Administration / Authorization
        </p>
        <div className="flex items-center gap-2">
          <ShieldCheck className="size-5 text-primary" />
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
            Access roles
          </h1>
        </div>
        <p className="max-w-3xl text-sm text-muted-foreground">
          Roles are reusable bundles of grants. Accounts can hold multiple
          roles; access is computed from their combined grants, and the backend
          checks each protected request.
        </p>
      </header>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)]">
        {canManage && (
          <Card className="h-fit">
            <CardHeader>
              <CardTitle>{editingId ? "Edit role" : "Create role"}</CardTitle>
              <CardDescription>
                Choose dashboard, domain, tool, and future feature/action
                permissions. Built-in roles are read-only.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form
                className="space-y-4"
                onSubmit={(event) => void saveRole(event)}
              >
                <div className="space-y-2">
                  <Label htmlFor="role-name">Role name</Label>
                  <Input
                    id="role-name"
                    required
                    minLength={2}
                    maxLength={60}
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role-description">Description</Label>
                  <textarea
                    id="role-description"
                    maxLength={240}
                    rows={2}
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                    className="w-full resize-y rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </div>
                <fieldset className="space-y-2">
                  <legend className="text-sm font-medium">
                    Workspace grants
                  </legend>
                  <div className="grid gap-1 sm:grid-cols-2">
                    {globalGrants
                      .filter(([key]) => canGrant(key))
                      .map(([key, label]) => (
                        <label
                          key={key}
                          className="flex items-start gap-2 rounded-md border p-2 text-xs"
                        >
                          <input
                            className="mt-0.5 accent-primary"
                            type="checkbox"
                            checked={selectedGrants.includes(key)}
                            onChange={() => toggleGrant(key)}
                          />
                          <span>
                            <span className="block font-medium">{label}</span>
                            <code className="text-[10px] text-muted-foreground">
                              {key}
                            </code>
                          </span>
                        </label>
                      ))}
                  </div>
                </fieldset>
                <fieldset className="space-y-2">
                  <legend className="text-sm font-medium">
                    Domain and tool access
                  </legend>
                  <div className="max-h-64 space-y-1 overflow-auto rounded-lg border p-2">
                    {allScopedGrants
                      .filter(({ key }) => canGrant(key))
                      .map(({ key, label }) => (
                        <label
                          key={key}
                          className="flex items-center gap-2 rounded-md px-2 py-1.5 text-xs hover:bg-muted/50"
                        >
                          <input
                            className="accent-primary"
                            type="checkbox"
                            checked={selectedGrants.includes(key)}
                            onChange={() => toggleGrant(key)}
                          />
                          <span className="flex-1">{label}</span>
                          <code className="text-[10px] text-muted-foreground">
                            {key}
                          </code>
                        </label>
                      ))}
                  </div>
                </fieldset>
                <fieldset className="space-y-2 rounded-lg border p-3">
                  <legend className="px-1 text-sm font-medium">
                    Future feature/action grant
                  </legend>
                  <p className="text-xs text-muted-foreground">
                    Use the same stable identifiers in a tool’s backend
                    authorization checks.
                  </p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <div className="space-y-1">
                      <Label htmlFor="feature-domain">Domain</Label>
                      <select
                        id="feature-domain"
                        value={featureDomain}
                        onChange={(event) => {
                          setFeatureDomain(event.target.value)
                          const next = domains.find(
                            (domain) => domain.id === event.target.value
                          )
                          setFeatureTool(next?.tools[0]?.id ?? "")
                        }}
                        className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
                      >
                        {domains.map((domain) => (
                          <option key={domain.id} value={domain.id}>
                            {domain.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="feature-tool">Tool</Label>
                      <select
                        id="feature-tool"
                        value={featureTool}
                        onChange={(event) => setFeatureTool(event.target.value)}
                        className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
                      >
                        {toolOptionsForFeature.map((tool) => (
                          <option key={tool.id} value={tool.id}>
                            {tool.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="feature-id">Feature id</Label>
                      <Input
                        id="feature-id"
                        placeholder="export-report"
                        value={featureId}
                        onChange={(event) => setFeatureId(event.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="feature-action">Action</Label>
                      <Input
                        id="feature-action"
                        placeholder="view, export, edit"
                        value={featureAction}
                        onChange={(event) =>
                          setFeatureAction(event.target.value)
                        }
                      />
                    </div>
                  </div>
                  <Button
                    className="mt-2"
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addFeatureGrant}
                  >
                    <Plus className="size-3.5" />
                    Add grant
                  </Button>
                </fieldset>
                {selectedGrants.filter((grant) => grant.startsWith("feature:"))
                  .length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {selectedGrants
                      .filter((grant) => grant.startsWith("feature:"))
                      .map((grant) => (
                        <button
                          key={grant}
                          type="button"
                          onClick={() => toggleGrant(grant)}
                          className="rounded-md border bg-muted/50 px-2 py-1 font-mono text-[10px] hover:bg-destructive/10"
                          title="Remove grant"
                        >
                          {grant} ×
                        </button>
                      ))}
                  </div>
                )}
                {error && (
                  <p role="alert" className="text-sm text-destructive">
                    {error}
                  </p>
                )}
                <div className="flex gap-2">
                  <Button type="submit" disabled={saving}>
                    {saving
                      ? "Saving…"
                      : editingId
                        ? "Save role"
                        : "Create role"}
                  </Button>
                  {editingId && (
                    <Button type="button" variant="outline" onClick={resetForm}>
                      Cancel
                    </Button>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-3">
              <div>
                <CardTitle>Role catalog</CardTitle>
                <CardDescription>
                  Built-in roles provide safe starting points. Custom roles can
                  be assigned in combination.
                </CardDescription>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setLoading(true)
                  void loadRoles()
                }}
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
                Loading access roles…
              </p>
            ) : roles.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No roles are configured.
              </p>
            ) : (
              <div className="space-y-2">
                {roles.map((role) => (
                  <article key={role.id} className="rounded-xl border p-3">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="text-sm font-semibold">{role.name}</h2>
                          {role.isBuiltIn && (
                            <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
                              Built-in
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {role.description || "No description."}
                        </p>
                        <p className="mt-2 text-xs text-muted-foreground">
                          {role.grants.length} grant
                          {role.grants.length === 1 ? "" : "s"} ·{" "}
                          {role.isAssignable ? "assignable" : "protected"}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-1">
                          {role.grants.slice(0, 8).map((grant) => (
                            <code
                              key={grant}
                              className="rounded bg-muted px-1.5 py-0.5 text-[10px]"
                            >
                              {grant}
                            </code>
                          ))}
                          {role.grants.length > 8 && (
                            <span className="text-[10px] text-muted-foreground">
                              +{role.grants.length - 8} more
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-1">
                        {canManage && role.isAssignable && (
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => editRole(role)}
                          >
                            Edit
                          </Button>
                        )}
                        {canManage && !role.isBuiltIn && (
                          <Button
                            type="button"
                            size="icon-sm"
                            variant="ghost"
                            aria-label={`Delete ${role.name}`}
                            onClick={() => void deleteRole(role)}
                          >
                            <Trash2 className="size-4 text-destructive" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
