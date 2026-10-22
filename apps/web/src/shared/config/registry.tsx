import { lazy } from "react"
import {
  Calculator,
  CircleDollarSign,
  Code2,
  HeartPulse,
  Link2,
  Timer,
  Wallet,
  Wrench,
  Zap,
} from "lucide-react"
import { EmiCalculatorSettingsPanel } from "@/domains/finance/tools/emi-calculator/EmiCalculatorSettingsPanel"
import {
  EmiAmortizationPanel,
  EmiInsightsPanel,
} from "@/domains/finance/tools/emi-calculator/EmiPanels"
import { PomodoroSettingsPanel } from "@/domains/productivity/tools/pomodoro-timer/PomodoroSettingsPanel"
import { financeDomain } from "@/domains/finance/config/domain"
import { productivityDomain } from "@/domains/productivity/config/domain"
import { healthDomain } from "@/domains/health/config/domain"
import { developerDomain } from "@/domains/developer/config/domain"
import { utilitiesDomain } from "@/domains/utilities/config/domain"
import type { DomainDefinition } from "@/shared/types/domain"
import type { ToolDefinition } from "@/shared/types/tool"
export type { DomainDefinition } from "@/shared/types/domain"
export type {
  ToolAvailability,
  ToolAvailabilityState,
  ToolContext,
  ToolDefinition,
  ToolSettingsPanelContext,
  ToolSettingsPanelDefinition,
} from "@/shared/types/tool"

const EmiCalculator = lazy(() =>
  import("@/domains/finance/tools/emi-calculator/EmiCalculator").then(
    (module) => ({ default: module.EmiCalculator })
  )
)
const PomodoroTimer = lazy(() =>
  import("@/domains/productivity/tools/pomodoro-timer/PomodoroTimer").then(
    (module) => ({ default: module.PomodoroTimer })
  )
)
const CompoundGrowth = lazy(() =>
  import("@/domains/finance/tools/compound-growth/CompoundGrowth").then(
    (module) => ({ default: module.CompoundGrowth })
  )
)
const WordCounter = lazy(() =>
  import("@/domains/productivity/tools/word-counter/WordCounter").then(
    (module) => ({ default: module.WordCounter })
  )
)
const HydrationTracker = lazy(() =>
  import("@/domains/health/tools/hydration-tracker/HydrationTracker").then(
    (module) => ({ default: module.HydrationTracker })
  )
)
const JsonFormatter = lazy(() =>
  import("@/domains/developer/tools/json-formatter/JsonFormatter").then(
    (module) => ({ default: module.JsonFormatter })
  )
)
const UuidGenerator = lazy(() =>
  import("@/domains/developer/tools/uuid-generator/UuidGenerator").then(
    (module) => ({ default: module.UuidGenerator })
  )
)
const ApiRequestBuilder = lazy(() =>
  import("@/domains/developer/tools/api-request-builder/ApiRequestBuilder").then(
    (module) => ({ default: module.ApiRequestBuilder })
  )
)
const UnitConverter = lazy(() =>
  import("@/domains/utilities/tools/unit-converter/UnitConverter").then(
    (module) => ({ default: module.UnitConverter })
  )
)
const UrlEncoder = lazy(() =>
  import("@/domains/utilities/tools/url-encoder/UrlEncoder").then((module) => ({
    default: module.UrlEncoder,
  }))
)

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
    {
      id: "compound-growth",
      name: "Compound growth calculator",
      description:
        "Estimate how regular investing and compounding may grow over time.",
      icon: CircleDollarSign,
      href: "/domains/finance/tools/compound-growth",
      category: "Calculators",
      component: CompoundGrowth,
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
    {
      id: "word-counter",
      name: "Word counter",
      description:
        "Count words, characters, paragraphs, and estimated reading time.",
      icon: Calculator,
      href: "/domains/productivity/tools/word-counter",
      category: "Writing",
      component: WordCounter,
    },
  ],
  health: [
    {
      id: "hydration-tracker",
      name: "Hydration tracker",
      description:
        "Track daily water intake with a simple, private progress counter.",
      icon: HeartPulse,
      href: "/domains/health/tools/hydration-tracker",
      category: "Wellness",
      component: HydrationTracker,
    },
  ],
  developer: [
    {
      id: "json-formatter",
      name: "JSON formatter",
      description: "Validate, format, minify, and copy JSON in your browser.",
      icon: Code2,
      href: "/domains/developer/tools/json-formatter",
      category: "Data formats",
      component: JsonFormatter,
    },
    {
      id: "uuid-generator",
      name: "UUID generator",
      description: "Generate version 4 identifiers locally.",
      icon: Code2,
      href: "/domains/developer/tools/uuid-generator",
      category: "Generators",
      component: UuidGenerator,
    },
    {
      id: "api-request-builder",
      name: "API request builder",
      description: "Prepare and inspect HTTP requests from one workspace.",
      icon: Link2,
      href: "/domains/developer/tools/api-request-builder",
      category: "API tools",
      component: ApiRequestBuilder,
      availability: {
        state: "coming-soon",
        message:
          "The request builder is in development. JSON formatting and UUID generation are ready to use now.",
      },
    },
  ],
  utilities: [
    {
      id: "unit-converter",
      name: "Unit converter",
      description: "Convert common length, mass, and temperature units.",
      icon: Wrench,
      href: "/domains/utilities/tools/unit-converter",
      category: "Converters",
      component: UnitConverter,
    },
    {
      id: "url-encoder",
      name: "URL encoder / decoder",
      description: "Encode or decode URL components locally.",
      icon: Link2,
      href: "/domains/utilities/tools/url-encoder",
      category: "Web utilities",
      component: UrlEncoder,
    },
  ],
}
export const domains: DomainDefinition[] = [
  { ...financeDomain, tools: registeredTools.finance },
  { ...productivityDomain, tools: registeredTools.productivity },
  { ...healthDomain, tools: registeredTools.health },
  { ...developerDomain, tools: registeredTools.developer },
  { ...utilitiesDomain, tools: registeredTools.utilities },
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
  developer: Code2,
  utilities: Wrench,
}
