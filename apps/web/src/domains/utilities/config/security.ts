/** Domain-level route visibility; each tool declares its own data and action contract. */
export const domainSecurity = {
  domainId: "utilities",
  accessGrant: "domain:utilities:access",
  dataPolicy: "tool-defined",
  backendPolicy: "tool-defined",
} as const
