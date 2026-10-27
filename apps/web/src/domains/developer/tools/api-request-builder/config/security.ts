/** Current tool security contract. Update this when implementation or data handling changes. */
export const toolSecurity = {
  dataScope: "none",
  backendRequired: false,
  sensitiveActions: [],
  toolAccessGrant: "tool:developer/api-request-builder:access",
  sensitiveActionGrants: [],
} as const
