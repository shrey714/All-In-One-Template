export {}

declare global {
  const __ORBIT_CONFIG__: {
    auth: {
      enabled: boolean
      inactivityTimeoutMinutes: number
      warningBeforeTimeoutSeconds: number
    }
  }
}
