import { Code2 } from "lucide-react"
import type { DomainDescriptor } from "@/shared/types/domain"

export const developerDomain = {
  id: "developer",
  name: "Developer",
  description:
    "Practical utilities for formatting, inspecting, and building software.",
  icon: {
    type: "image",
    src: "https://cdn.simpleicons.org/github/16a34a",
    fallback: Code2,
  },
  tone: "blue",
} satisfies DomainDescriptor
