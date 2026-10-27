/** Current tool security contract. Update this when implementation or data handling changes. */
export const toolSecurity = {
  dataScope: "none",
  backendRequired: false,
  sensitiveActions: [],
  toolAccessGrant: "tool:developer/markdown-preview:access",
  sensitiveActionGrants: [],
} as const
