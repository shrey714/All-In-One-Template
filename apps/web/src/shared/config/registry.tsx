import { lazy } from "react"
import {
  Calculator,
  CircleDollarSign,
  Code2,
  BookOpen,
  Clock3,
  FileDiff,
  FileSpreadsheet,
  FileText,
  Hash,
  HeartPulse,
  Image,
  KeyRound,
  Link2,
  ListTodo,
  Palette,
  PiggyBank,
  QrCode,
  Regex,
  Scale,
  Terminal,
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
import type {
  ToolAvailability,
  ToolAvailabilityState,
  ToolDefinition,
} from "@/shared/types/tool"
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

const ComingSoonTool: ToolDefinition["component"] = () => null
const ErrorBoundaryDemoTool: ToolDefinition["component"] = () => {
  throw new Error("Intentional Cron Helper failure for boundary testing.")
}
const plannedAvailability = (
  message: string,
  state: ToolAvailabilityState = "coming-soon"
): ToolAvailability => ({
  state,
  message,
})
const plannedPosterOverrides: Partial<Record<string, ToolAvailability>> = {
  "loan-comparison": plannedAvailability(
    "This planned finance tool requires access to the finance workspace.",
    "access-required"
  ),
  "savings-goal-planner": plannedAvailability(
    "Configure workspace savings defaults before enabling this planner.",
    "configuration-required"
  ),
  "task-checklist": plannedAvailability(
    "The task checklist is temporarily unavailable while its preview is refreshed.",
    "temporarily-unavailable"
  ),
  "regex-tester": plannedAvailability(
    "A known issue is preventing the regex tester from being enabled.",
    "error"
  ),
  "sql-formatter": plannedAvailability(
    "The SQL formatter is offline for a scheduled maintenance update.",
    "maintenance"
  ),
  "base64-encoder": plannedAvailability(
    "The Base64 encoder is temporarily unavailable. Please try again later.",
    "temporarily-unavailable"
  ),
  "hash-generator": plannedAvailability(
    "Access to the hash generator is restricted by workspace policy.",
    "access-required"
  ),
  "password-generator": plannedAvailability(
    "Set a workspace password policy before enabling this generator.",
    "configuration-required"
  ),
  "qr-code-generator": plannedAvailability(
    "The QR code generator is offline during a maintenance update.",
    "maintenance"
  ),
  "csv-json-converter": plannedAvailability(
    "The CSV / JSON converter is disabled by workspace configuration.",
    "disabled"
  ),
  "image-optimizer": plannedAvailability(
    "The image optimizer is temporarily unavailable while its service is checked.",
    "temporarily-unavailable"
  ),
}
const plannedTool = (
  domainId: string,
  id: string,
  name: string,
  description: string,
  category: string,
  icon: ToolDefinition["icon"],
  availability?: ToolAvailability
): ToolDefinition => ({
  id,
  name,
  description,
  icon,
  href: `/domains/${domainId}/tools/${id}`,
  category,
  component: ComingSoonTool,
  availability:
    availability ??
    plannedPosterOverrides[id] ??
    plannedAvailability(`${name} is planned for a future release.`),
})

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
      component: ComingSoonTool,
      availability: plannedAvailability(
        "This calculator is planned for a future release."
      ),
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
      component: ComingSoonTool,
      availability: plannedAvailability(
        "This writing tool is planned for a future release."
      ),
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
      component: ComingSoonTool,
      availability: plannedAvailability(
        "The hydration tracker is offline during a maintenance update.",
        "maintenance"
      ),
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
      component: ComingSoonTool,
      availability: plannedAvailability(
        "The JSON formatter is temporarily unavailable while its release is prepared.",
        "temporarily-unavailable"
      ),
    },
    {
      id: "uuid-generator",
      name: "UUID generator",
      description: "Generate version 4 identifiers locally.",
      icon: Code2,
      href: "/domains/developer/tools/uuid-generator",
      category: "Generators",
      component: ComingSoonTool,
      availability: plannedAvailability(
        "Complete the generator setup before this tool can be enabled.",
        "configuration-required"
      ),
    },
    {
      id: "api-request-builder",
      name: "API request builder",
      description: "Prepare and inspect HTTP requests from one workspace.",
      icon: Link2,
      href: "/domains/developer/tools/api-request-builder",
      category: "API tools",
      component: ComingSoonTool,
      availability: plannedAvailability(
        "This API tool is planned for a future release."
      ),
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
      component: ComingSoonTool,
      availability: plannedAvailability(
        "A known issue is preventing the unit converter from being enabled.",
        "error"
      ),
    },
    {
      id: "url-encoder",
      name: "URL encoder / decoder",
      description: "Encode or decode URL components locally.",
      icon: Link2,
      href: "/domains/utilities/tools/url-encoder",
      category: "Web utilities",
      component: ComingSoonTool,
      availability: plannedAvailability(
        "This web utility has been disabled by workspace configuration.",
        "disabled"
      ),
    },
  ],
}

const additionalPlannedTools: Record<string, ToolDefinition[]> = {
  finance: [
    plannedTool(
      "finance",
      "loan-comparison",
      "Loan comparison planner",
      "Compare loan scenarios, repayment terms, and estimated costs.",
      "Planning",
      Scale
    ),
    plannedTool(
      "finance",
      "savings-goal-planner",
      "Savings goal planner",
      "Plan contributions toward a savings target and timeline.",
      "Planning",
      PiggyBank
    ),
  ],
  productivity: [
    plannedTool(
      "productivity",
      "task-checklist",
      "Task checklist",
      "Organize lightweight tasks and track progress in one place.",
      "Planning",
      ListTodo
    ),
    plannedTool(
      "productivity",
      "reading-time-estimator",
      "Reading time estimator",
      "Estimate reading duration from a text or document length.",
      "Writing",
      BookOpen
    ),
  ],
  developer: [
    plannedTool(
      "developer",
      "regex-tester",
      "Regex tester",
      "Draft and inspect regular expressions against sample text.",
      "Text tools",
      Regex
    ),
    plannedTool(
      "developer",
      "markdown-preview",
      "Markdown preview",
      "Preview Markdown documents with a clean rendered view.",
      "Documentation",
      FileText
    ),
    plannedTool(
      "developer",
      "sql-formatter",
      "SQL formatter",
      "Format SQL statements for readability and review.",
      "Data formats",
      Terminal
    ),
    plannedTool(
      "developer",
      "base64-encoder",
      "Base64 encoder / decoder",
      "Encode and decode text with Base64 for development workflows.",
      "Encoders",
      Hash
    ),
    plannedTool(
      "developer",
      "hash-generator",
      "Hash generator",
      "Generate common cryptographic digests from text or files.",
      "Security",
      KeyRound
    ),
    plannedTool(
      "developer",
      "text-diff",
      "Text diff checker",
      "Compare two text snippets and highlight their differences.",
      "Text tools",
      FileDiff
    ),
    {
      id: "cron-helper",
      name: "Cron expression helper",
      description: "Inspect and compose human-readable cron schedules.",
      icon: Clock3,
      href: "/domains/developer/tools/cron-helper",
      category: "Scheduling",
      component: ErrorBoundaryDemoTool,
    },
    plannedTool(
      "developer",
      "color-converter",
      "Color converter",
      "Convert colors between common web color formats.",
      "Design tools",
      Palette
    ),
    plannedTool(
      "developer",
      "timestamp-converter",
      "Timestamp converter",
      "Translate Unix timestamps and human-readable dates.",
      "Date and time",
      Clock3
    ),
  ],
  utilities: [
    plannedTool(
      "utilities",
      "password-generator",
      "Password generator",
      "Create strong random passwords with configurable character sets.",
      "Security",
      KeyRound
    ),
    plannedTool(
      "utilities",
      "qr-code-generator",
      "QR code generator",
      "Create QR codes for links, contact details, and plain text.",
      "Generators",
      QrCode
    ),
    plannedTool(
      "utilities",
      "csv-json-converter",
      "CSV / JSON converter",
      "Convert tabular CSV data to JSON and back.",
      "Data tools",
      FileSpreadsheet
    ),
    plannedTool(
      "utilities",
      "image-optimizer",
      "Image optimizer",
      "Prepare image assets for smaller file sizes and faster pages.",
      "Media tools",
      Image
    ),
    plannedTool(
      "utilities",
      "text-case-converter",
      "Text case converter",
      "Transform text between common capitalization styles.",
      "Text tools",
      FileText
    ),
  ],
}
for (const [domainId, tools] of Object.entries(additionalPlannedTools)) {
  registeredTools[domainId]?.push(...tools)
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
