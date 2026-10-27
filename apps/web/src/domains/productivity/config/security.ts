/** Domain-level route visibility; each tool declares its own data and action contract. */
export const domainSecurity = {
  domainId: "productivity",
  accessGrant: "domain:productivity:access",
  dataPolicy: "tool-defined",
  backendPolicy: "tool-defined",
} as const
