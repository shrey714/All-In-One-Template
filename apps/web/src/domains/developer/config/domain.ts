import { Code2 } from "lucide-react"
import type { DomainDescriptor } from "@/shared/types/domain"

export const developerDomain = {
  id: "developer",
  name: "Developer",
  description:
    "Practical utilities for formatting, inspecting, and building software.",
  icon: Code2,
  tone: "blue",
} satisfies DomainDescriptor
