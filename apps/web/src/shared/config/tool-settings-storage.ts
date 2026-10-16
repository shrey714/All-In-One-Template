import { appConfig } from "@/shared/config/app-config"

export function getToolSettingsStorageKey(domainId: string, toolId: string) {
  return `${appConfig.storageNamespace}.tools.${domainId}.${toolId}.settings`
}
