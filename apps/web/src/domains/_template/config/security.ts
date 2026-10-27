/** Domain-level route scope; each tool declares its own data and action contract. */
export const domainSecurity = {
  domainId: "replace-domain",
  accessGrant: "domain:replace-domain:access",
  dataPolicy: "tool-defined",
  backendPolicy: "tool-defined",
} as const
