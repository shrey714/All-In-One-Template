import { Wrench } from "lucide-react"
import type { DomainDescriptor } from "@/shared/types/domain"

export const utilitiesDomain = {
  id: "utilities",
  name: "Utilities",
  description: "Small, dependable tools for common everyday tasks.",
  icon: Wrench,
  tone: "cyan",
} satisfies DomainDescriptor
