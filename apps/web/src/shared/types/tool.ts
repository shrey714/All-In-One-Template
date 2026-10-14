import type { ComponentType } from "react"
export type ToolContext = { domainId: string; toolId: string; stepId?: string }
export type ToolDefinition = { id: string; name: string; description: string; icon: ComponentType<{ className?: string }>; href: string; category: string; component: ComponentType<ToolContext> }
