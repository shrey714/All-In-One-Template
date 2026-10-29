import { Wallet } from "lucide-react"
import type { DomainDescriptor } from "@/shared/types/domain"
export const financeDomain = {
  id: "finance",
  name: "Finance",
  description: "Make confident decisions with practical money tools.",
  icon: {
    type: "image",
    src: "/icons/finance-domain.svg",
    fallback: Wallet,
  },
  tone: "violet",
} satisfies DomainDescriptor
