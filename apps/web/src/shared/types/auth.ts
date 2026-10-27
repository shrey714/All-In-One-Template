export type UserRole = "admin" | "member"
export type Permission = string

export interface AssignedRole {
  id: string
  name: string
  isBuiltIn: boolean
  isAssignable: boolean
}

export interface AuthUser {
  id: number
  username: string
  displayName: string
  /** Legacy display label only; never use this field for authorization. */
  role: UserRole
  roles: AssignedRole[]
  permissions: Permission[]
  mustChangePassword: boolean
}

export interface ManagedUser extends AuthUser {
  isActive: boolean
  createdAt: string
}

export interface AccessRole extends AssignedRole {
  description: string
  grants: Permission[]
}

export function hasPermission(
  user: Pick<AuthUser, "permissions"> | null | undefined,
  permission: Permission
) {
  return Array.isArray(user?.permissions)
    ? user.permissions.includes("*") || user.permissions.includes(permission)
    : false
}

export function hasDashboardAccess(
  user: Pick<AuthUser, "permissions"> | null | undefined
) {
  return hasPermission(user, "dashboard:access")
}

export function canAccessTool(
  user: Pick<AuthUser, "permissions"> | null | undefined,
  domainId: string,
  toolId: string
) {
  return (
    hasPermission(user, "tools:use") ||
    hasPermission(user, `domain:${domainId}:access`) ||
    hasPermission(user, `tool:${domainId}/${toolId}:access`)
  )
}

export function canAccessDomain(
  user: Pick<AuthUser, "permissions"> | null | undefined,
  domainId: string,
  toolIds: readonly string[]
) {
  return (
    hasPermission(user, "tools:use") ||
    hasPermission(user, `domain:${domainId}:access`) ||
    toolIds.some((toolId) =>
      hasPermission(user, `tool:${domainId}/${toolId}:access`)
    )
  )
}

export function hasFeaturePermission(
  user: Pick<AuthUser, "permissions"> | null | undefined,
  domainId: string,
  toolId: string,
  featureId: string,
  action: string
) {
  return hasPermission(
    user,
    `feature:${domainId}/${toolId}/${featureId}:${action}`
  )
}
