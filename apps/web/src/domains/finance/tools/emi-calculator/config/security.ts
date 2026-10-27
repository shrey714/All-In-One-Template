/** Current tool security contract. Update this when implementation or data handling changes. */
export const toolSecurity = {
  dataScope: "device",
  backendRequired: false,
  sensitiveActions: [],
  toolAccessGrant: "tool:finance/emi-calculator:access",
  sensitiveActionGrants: [],
} as const
