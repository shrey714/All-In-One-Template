import { Sparkles } from "lucide-react"
import type { DomainDescriptor } from "@/shared/types/domain"

export const exampleDomain = {
  id: "example",
  name: "Example",
  description: "Describe the purpose and value of this domain.",
  // Swap this for { type: "image", src: "/brand/example.svg" } if desired.
  icon: Sparkles,
  tone: "blue",
} satisfies DomainDescriptor
