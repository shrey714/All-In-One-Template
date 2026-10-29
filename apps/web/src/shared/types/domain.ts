import type { IconSource } from "@/shared/types/icon"
import type { ToolDefinition } from "@/shared/types/tool"
export type DomainDescriptor = {
  id: string
  name: string
  description: string
  icon: IconSource
  tone: string
}
export type DomainDefinition = DomainDescriptor & { tools: ToolDefinition[] }
