/** Domain-level route visibility; each tool declares its own data and action contract. */
export const domainSecurity = {
  domainId: "developer",
  accessGrant: "domain:developer:access",
  dataPolicy: "tool-defined",
  backendPolicy: "tool-defined",
} as const
