export {}

declare global {
  const __ORBIT_CONFIG__: {
    auth: {
      enabled: boolean
      inactivityTimeoutMinutes: number
      warningBeforeTimeoutSeconds: number
    }
    branding: {
      shortName: string
      productName: string
      tagline: string
      logoPath: string
      faviconPath: string
      supportUrl: string
      supportLabel: string
      signIn: {
        eyebrow: string
        headline: string
        description: string
        formTitle: string
        formDescription: string
        submitLabel: string
        footerNote: string
      }
      colors: {
        light: { primary: string; primaryForeground: string }
        dark: { primary: string; primaryForeground: string }
      }
    }
  }
}
