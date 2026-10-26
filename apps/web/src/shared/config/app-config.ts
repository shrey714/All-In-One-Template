import { branding } from "@/shared/config/orbit-config"

export const appConfig = {
  name: branding.shortName,
  productName: branding.productName,
  defaultSidebarWidth: 286,
  minSidebarWidth: 224,
  maxSidebarWidth: 440,
  defaultRightPanelWidth: 320,
  minRightPanelWidth: 240,
  maxRightPanelWidth: 520,
  defaultBottomPanelHeight: 240,
  minBottomPanelHeight: 140,
  maxBottomPanelHeight: 480,
  storageNamespace: "orbit.workspace",
} as const
