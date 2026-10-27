export const GLOBAL_GRANTS = [
  "dashboard:access",
  "tools:use",
  "preferences:manage-own",
  "users:read",
  "users:create",
  "users:assign-roles",
  "users:manage-access",
  "users:reset-credentials",
  "roles:read",
  "roles:manage",
] as const

export type GlobalGrant = (typeof GLOBAL_GRANTS)[number]
export type Permission = GlobalGrant | (string & {})
export type UserRole = "admin" | "member"

export interface BuiltInRole {
  id: string
  name: string
  description: string
  assignable: boolean
  grants: readonly string[]
}

export const BUILT_IN_ROLES: readonly BuiltInRole[] = [
  {
    id: "system-admin",
    name: "System administrator",
    description:
      "Protected bootstrap role with unrestricted workspace administration.",
    assignable: false,
    grants: ["*"],
  },
  {
    id: "dashboard-access",
    name: "Dashboard access",
    description:
      "Allows sign-in to the dashboard without granting tools by itself.",
    assignable: true,
    grants: ["dashboard:access"],
  },
  {
    id: "all-tools-user",
    name: "All tools user",
    description: "Allows dashboard access and use of every registered tool.",
    assignable: true,
    grants: ["dashboard:access", "tools:use"],
  },
  {
    id: "access-manager",
    name: "Access manager",
    description:
      "Manages accounts, assignable roles, and access policies; does not grant tool access.",
    assignable: true,
    grants: [
      "dashboard:access",
      "users:read",
      "users:create",
      "users:assign-roles",
      "users:manage-access",
      "users:reset-credentials",
      "roles:read",
      "roles:manage",
    ],
  },
]

const domainGrant = /^domain:[a-z][a-z0-9]*(?:-[a-z0-9]+)*:access$/
const toolGrant =
  /^tool:[a-z][a-z0-9]*(?:-[a-z0-9]+)*\/[a-z][a-z0-9]*(?:-[a-z0-9]+)*:access$/
const featureGrant =
  /^feature:[a-z][a-z0-9]*(?:-[a-z0-9]+)*\/[a-z][a-z0-9]*(?:-[a-z0-9]+)*\/[a-z][a-z0-9]*(?:-[a-z0-9]+)*:[a-z][a-z0-9-]*$/

const allowedGlobalGrants = new Set<string>(GLOBAL_GRANTS)

export function isValidGrant(value: unknown): value is Permission {
  if (typeof value !== "string" || value.length > 180) return false
  return (
    allowedGlobalGrants.has(value) ||
    domainGrant.test(value) ||
    toolGrant.test(value) ||
    featureGrant.test(value)
  )
}

export function isSystemGrant(value: string) {
  return value === "*"
}

export function toolAccessGrants(domainId: string, toolId: string) {
  return [
    "tools:use",
    `domain:${domainId}:access`,
    `tool:${domainId}/${toolId}:access`,
  ]
}

export function domainAccessGrants(domainId: string) {
  return ["tools:use", `domain:${domainId}:access`]
}

export function roleHasPermission(
  grants: readonly string[],
  permission: string
) {
  return grants.includes("*") || grants.includes(permission)
}
