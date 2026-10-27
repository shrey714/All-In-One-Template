/** Current tool security contract. Update this when implementation or data handling changes. */
export const toolSecurity = {
  dataScope: "device",
  backendRequired: false,
  sensitiveActions: [],
  toolAccessGrant: "tool:productivity/pomodoro-timer:access",
  sensitiveActionGrants: [],
} as const
