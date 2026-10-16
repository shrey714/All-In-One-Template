import { useState, type ComponentType } from "react"
import { Search, Settings2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog"
import { Input } from "@workspace/ui/components/input"
import { useTheme } from "@/components/theme-provider"
import { allTools } from "@/shared/config/registry"
import {
  dashboardSettingsCategories,
  type DashboardSettingsContext,
  type SettingsCategoryDefinition,
  type SettingsScope,
} from "@/shared/config/settings-registry"
import type {
  ToolDefinition,
  ToolSettingsPanelContext,
  ToolSettingsPanelDefinition,
} from "@/shared/types/tool"

const scopeLabels: Record<SettingsScope, string> = {
  user: "User",
  workspace: "Workspace",
}

type Props = Omit<DashboardSettingsContext, "theme" | "setTheme"> & {
  open: boolean
  onOpenChange: (open: boolean) => void
  tool?: ToolDefinition
  toolDomainId?: string
}

type IconComponent = ComponentType<{ className?: string }>
type RegisteredTool = (typeof allTools)[number]
type NavigationSection = {
  id: string
  label: string
  description: string
  scope: SettingsScope
  icon: IconComponent
  fields?: SettingsCategoryDefinition["fields"]
  toolPage?: ToolSettingsPanelDefinition
  tool?: RegisteredTool
}

export function ConfigManagerDialog({
  open,
  onOpenChange,
  tool,
  toolDomainId,
  ...settingsProps
}: Props) {
  const { theme, setTheme } = useTheme()
  const settings: DashboardSettingsContext = {
    ...settingsProps,
    theme,
    setTheme,
  }
  const toolPageSections: NavigationSection[] = allTools.flatMap(
    (registeredTool) =>
      (registeredTool.settings ?? []).map((page) => ({
        id: `tool:${registeredTool.domainId}:${registeredTool.id}:${page.id}`,
        label: page.label,
        description: page.description,
        scope: "user" as const,
        icon: registeredTool.icon,
        toolPage: page,
        tool: registeredTool,
      }))
  )

  const sections: NavigationSection[] = [
    ...dashboardSettingsCategories.map((category) => ({
      ...category,
      id: `global:${category.id}`,
    })),
    ...toolPageSections,
  ]
  const activeToolSection = tool
    ? toolPageSections.find(
        (section) =>
          section.tool?.id === tool.id && section.tool.domainId === toolDomainId
      )
    : undefined
  const [scope, setScope] = useState<SettingsScope>("user")
  const [query, setQuery] = useState("")
  const [selectedSectionId, setSelectedSectionId] = useState(
    () => activeToolSection?.id ?? "global:common"
  )
  const normalizedQuery = query.trim().toLowerCase()
  const visibleSections = sections.filter((section) => {
    if (section.scope !== scope) return false
    if (!normalizedQuery) return true
    const sectionText =
      `${section.label} ${section.description} ${section.tool?.name ?? ""} ${section.tool?.domainName ?? ""} ${section.toolPage?.keywords?.join(" ") ?? ""}`.toLowerCase()
    const categoryMatch = sectionText.includes(normalizedQuery)
    const fieldMatch = section.fields?.some((field) =>
      `${field.label} ${field.description} ${(field.keywords ?? []).join(" ")}`
        .toLowerCase()
        .includes(normalizedQuery)
    )
    return categoryMatch || fieldMatch
  })
  const activeSection =
    visibleSections.find((section) => section.id === selectedSectionId) ??
    visibleSections[0]
  const activeFields = activeSection?.fields?.filter((field) => {
    if (field.isAvailable && !field.isAvailable(settings)) return false
    if (!normalizedQuery) return true
    const fieldText =
      `${field.label} ${field.description} ${(field.keywords ?? []).join(" ")}`.toLowerCase()
    return (
      fieldText.includes(normalizedQuery) ||
      `${activeSection.label} ${activeSection.description}`
        .toLowerCase()
        .includes(normalizedQuery)
    )
  })
  const toolGroups = allTools
    .map((registeredTool) => ({
      tool: registeredTool,
      sections: visibleSections.filter(
        (section) =>
          section.tool?.domainId === registeredTool.domainId &&
          section.tool.id === registeredTool.id
      ),
    }))
    .filter((group) => group.sections.length > 0)

  const changeScope = (nextScope: SettingsScope) => {
    setScope(nextScope)
    const nextSection =
      nextScope === "user" && activeToolSection
        ? activeToolSection
        : sections.find((section) => section.scope === nextScope)
    if (nextSection) setSelectedSectionId(nextSection.id)
  }

  const toolContext: ToolSettingsPanelContext | undefined = activeSection?.tool
    ? {
        domainId: activeSection.tool.domainId,
        toolId: activeSection.tool.id,
      }
    : undefined
  const ToolSettingsPage = activeSection?.toolPage?.component

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton
        className="flex h-[min(820px,calc(100dvh-2rem))] w-[min(1120px,calc(100vw-2rem))] max-w-none flex-col gap-0 overflow-hidden rounded-lg p-0 sm:max-w-none"
      >
        <DialogHeader className="flex min-h-12 shrink-0 flex-row items-center border-b px-4 pr-12">
          <div className="flex min-w-0 items-center gap-2">
            <Settings2 className="size-4 shrink-0 text-muted-foreground" />
            <DialogTitle className="text-sm font-semibold">
              Settings
            </DialogTitle>
            {activeSection?.tool && (
              <span className="truncate border-l pl-2 text-xs text-muted-foreground">
                {activeSection.tool.name}
              </span>
            )}
          </div>
          <DialogDescription className="sr-only">
            Search and customize Orbit dashboard preferences and settings for
            all registered tools.
          </DialogDescription>
        </DialogHeader>

        <div className="shrink-0 space-y-3 border-b px-4 py-3">
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search settings"
              aria-label="Search settings"
              className="h-9 rounded-sm pl-9 text-xs"
            />
          </div>
          <div
            role="tablist"
            aria-label="Settings scope"
            className="flex items-center gap-1"
          >
            {(["user", "workspace"] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                role="tab"
                aria-selected={scope === tab}
                onClick={() => changeScope(tab)}
                className={`rounded-sm border-b-2 px-3 py-1.5 text-xs transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none ${scope === tab ? "border-primary bg-muted font-medium text-foreground" : "border-transparent text-muted-foreground hover:bg-muted/60 hover:text-foreground"}`}
              >
                {scopeLabels[tab]}
              </button>
            ))}
          </div>
        </div>

        <div className="flex min-h-0 flex-1">
          <aside className="w-52 shrink-0 overflow-y-auto border-r bg-muted/15 p-2 sm:w-60">
            {scope === "workspace" && (
              <p className="px-2 pt-2 pb-1 text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
                Workspace
              </p>
            )}
            <nav
              aria-label={`${scopeLabels[scope]} settings`}
              className="space-y-0.5"
            >
              {visibleSections
                .filter((section) => !section.tool)
                .map((section) => (
                  <SectionButton
                    key={section.id}
                    section={section}
                    selected={activeSection?.id === section.id}
                    onClick={() => setSelectedSectionId(section.id)}
                  />
                ))}
              {scope === "user" && toolGroups.length > 0 && (
                <div className="mt-3 space-y-1 border-t pt-3">
                  <p className="truncate px-2 pb-1 text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
                    Tool settings
                  </p>
                  {toolGroups.map(({ tool: registeredTool, sections }) => (
                    <div
                      key={`${registeredTool.domainId}:${registeredTool.id}`}
                    >
                      <p className="truncate px-2 pt-2 pb-1 text-[10px] font-medium text-muted-foreground">
                        {registeredTool.domainName} · {registeredTool.name}
                      </p>
                      {sections.map((section) => (
                        <SectionButton
                          key={section.id}
                          section={section}
                          selected={activeSection?.id === section.id}
                          nested
                          onClick={() => setSelectedSectionId(section.id)}
                        />
                      ))}
                    </div>
                  ))}
                </div>
              )}
              {visibleSections.length === 0 && (
                <p className="px-2 py-3 text-xs text-muted-foreground">
                  No matching settings.
                </p>
              )}
            </nav>
          </aside>

          <main className="min-w-0 flex-1 overflow-y-auto px-5 py-5 sm:px-7 sm:py-6">
            {activeSection ? (
              <div className="mx-auto max-w-4xl">
                <div className="mb-5 border-b pb-4">
                  <h2 className="text-xl font-semibold tracking-tight">
                    {activeSection.tool
                      ? `${activeSection.tool.name} · ${activeSection.label}`
                      : activeSection.label}
                  </h2>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    {activeSection.description}
                  </p>
                  {activeSection.tool && (
                    <p className="mt-2 text-[10px] text-muted-foreground">
                      Tool-specific settings · saved on this device
                    </p>
                  )}
                </div>

                {ToolSettingsPage && toolContext ? (
                  <ToolSettingsPage {...toolContext} />
                ) : activeSection.tool ? (
                  <div className="rounded-md border border-dashed px-4 py-5 text-sm text-muted-foreground">
                    This tool has no settings registered yet. Add a settings
                    page to its tool definition to make it available here.
                  </div>
                ) : activeFields?.length ? (
                  <div className="divide-y divide-border/60">
                    {activeFields.map((field) => (
                      <div key={field.id}>{field.render(settings)}</div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-md border border-dashed px-4 py-5 text-sm text-muted-foreground">
                    No settings match this search.
                  </div>
                )}
              </div>
            ) : (
              <div className="py-10 text-center text-sm text-muted-foreground">
                Choose a settings category or adjust your search.
              </div>
            )}
          </main>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function SectionButton({
  section,
  selected,
  nested = false,
  onClick,
}: {
  section: NavigationSection
  selected: boolean
  nested?: boolean
  onClick: () => void
}) {
  const Icon = section.icon
  return (
    <button
      type="button"
      aria-current={selected ? "page" : undefined}
      onClick={onClick}
      className={`flex min-h-8 w-full items-center gap-2 rounded-sm px-2 text-left text-xs transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none w-[stretch] ${selected ? "bg-accent font-medium text-accent-foreground" : "text-foreground hover:bg-muted"}`}
    >
      <Icon className="size-3.5 shrink-0" />
      <span className="truncate">{section.label}</span>
    </button>
  )
}
