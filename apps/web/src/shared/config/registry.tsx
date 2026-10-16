import { Calculator, HeartPulse, Timer, Wallet, Zap } from "lucide-react"
import { EmiCalculator } from "@/domains/finance/tools/emi-calculator/EmiCalculator"
import { EmiCalculatorSettingsPanel } from "@/domains/finance/tools/emi-calculator/EmiCalculatorSettingsPanel"
import {
  EmiAmortizationPanel,
  EmiInsightsPanel,
} from "@/domains/finance/tools/emi-calculator/EmiPanels"
import { PomodoroTimer } from "@/domains/productivity/tools/pomodoro-timer/PomodoroTimer"
import { PomodoroSettingsPanel } from "@/domains/productivity/tools/pomodoro-timer/PomodoroSettingsPanel"
import { financeDomain } from "@/domains/finance/config/domain"
import { productivityDomain } from "@/domains/productivity/config/domain"
import { healthDomain } from "@/domains/health/config/domain"
import type { DomainDefinition } from "@/shared/types/domain"
import type { ToolDefinition } from "@/shared/types/tool"
export type { DomainDefinition } from "@/shared/types/domain"
export type {
  ToolContext,
  ToolDefinition,
  ToolSettingsPanelContext,
  ToolSettingsPanelDefinition,
} from "@/shared/types/tool"

const registeredTools: Record<string, ToolDefinition[]> = {
  finance: [
    {
      id: "emi-calculator",
      name: "EMI calculator",
      description: "Estimate monthly loan payments and total interest.",
      icon: Calculator,
      href: "/domains/finance/tools/emi-calculator",
      category: "Calculators",
      component: EmiCalculator,
      panels: {
        right: { title: "Loan insights", component: EmiInsightsPanel },
        bottom: {
          title: "Amortization schedule",
          component: EmiAmortizationPanel,
        },
      },
      settings: [
        {
          id: "calculator-defaults",
          label: "Calculator defaults",
          description: "Choose the default loan values for new calculations.",
          keywords: [
            "loan amount",
            "interest rate",
            "loan term",
            "principal",
            "years",
            "emi",
          ],
          component: EmiCalculatorSettingsPanel,
        },
      ],
    },
  ],
  productivity: [
    {
      id: "pomodoro-timer",
      name: "Pomodoro timer",
      description: "Work in focused intervals with restorative breaks.",
      icon: Timer,
      href: "/domains/productivity/tools/pomodoro-timer",
      category: "Focus",
      component: PomodoroTimer,
      settings: [
        {
          id: "timer-duration",
          label: "Timer duration",
          description: "Configure the default focus-session length.",
          keywords: ["focus", "minutes", "session", "pomodoro", "timer"],
          component: PomodoroSettingsPanel,
        },
      ],
    },
  ],
  health: [],
}
export const domains: DomainDefinition[] = [
  { ...financeDomain, tools: registeredTools.finance },
  { ...productivityDomain, tools: registeredTools.productivity },
  { ...healthDomain, tools: registeredTools.health },
]
export const allTools = domains.flatMap((domain) =>
  domain.tools.map((tool) => ({
    ...tool,
    domainId: domain.id,
    domainName: domain.name,
  }))
)
export const getDomain = (domainId: string) =>
  domains.find((domain) => domain.id === domainId)
export const getTool = (domainId: string, toolId: string) =>
  getDomain(domainId)?.tools.find((tool) => tool.id === toolId)
export const domainIcons = {
  finance: Wallet,
  productivity: Zap,
  health: HeartPulse,
}
