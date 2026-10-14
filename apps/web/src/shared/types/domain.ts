import type { ComponentType } from "react"
import type { ToolDefinition } from "@/shared/types/tool"
export type DomainDescriptor = { id: string; name: string; description: string; icon: ComponentType<{ className?: string }>; tone: string }
export type DomainDefinition = DomainDescriptor & { tools: ToolDefinition[] }
