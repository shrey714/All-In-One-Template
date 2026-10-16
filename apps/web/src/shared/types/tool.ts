import type { ComponentType } from "react"

export type ToolContext = { domainId: string; toolId: string; stepId?: string }
export type ToolPanelDefinition = {
  title: string
  component: ComponentType<ToolContext>
}
export type ToolSettingsPanelContext = {
  domainId: string
  toolId: string
}
export type ToolSettingsPanelDefinition = {
  id: string
  label: string
  description: string
  keywords?: string[]
  component: ComponentType<ToolSettingsPanelContext>
}
export type ToolDefinition = {
  id: string
  name: string
  description: string
  icon: ComponentType<{ className?: string }>
  href: string
  category: string
  component: ComponentType<ToolContext>
  panels?: {
    right?: ToolPanelDefinition
    bottom?: ToolPanelDefinition
  }
  settings?: ToolSettingsPanelDefinition[]
}
