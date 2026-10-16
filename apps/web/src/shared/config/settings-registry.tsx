import type { ReactNode } from "react"
import type { LucideIcon } from "lucide-react"
import {
  LayoutDashboard,
  Maximize2,
  Monitor,
  Moon,
  PanelsTopLeft,
  RotateCcw,
  Sparkles,
  Sun,
} from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import { Switch } from "@workspace/ui/components/switch"
import { appConfig } from "@/shared/config/app-config"
import type { SidebarView } from "@/shared/types/workspace"

export type SettingsScope = "user" | "workspace"
export type ThemeChoice = "light" | "dark" | "system"

export type DashboardSettingsContext = {
  theme: ThemeChoice
  setTheme: (theme: ThemeChoice) => void
  compact: boolean
  onCompactChange: (value: boolean) => void
  showStatusBar: boolean
  onStatusBarChange: (value: boolean) => void
  activityRailVisible: boolean
  onActivityRailVisibleChange: (value: boolean) => void
  sidebarView: SidebarView
  onSidebarViewChange: (view: SidebarView) => void
  sidebarVisible: boolean
  onSidebarVisibleChange: (value: boolean) => void
  sidebarCollapsed: boolean
  onSidebarCollapsedChange: (value: boolean) => void
  sidebarWidth: number
  onSidebarWidthChange: (value: number) => void
  rightPanelAvailable: boolean
  rightPanelOpen: boolean
  onRightPanelOpenChange: (value: boolean) => void
  rightPanelWidth: number
  onRightPanelWidthChange: (value: number) => void
  bottomPanelAvailable: boolean
  bottomPanelOpen: boolean
  onBottomPanelOpenChange: (value: boolean) => void
  bottomPanelHeight: number
  onBottomPanelHeightChange: (value: number) => void
  centeredContent: boolean
  onCenteredContentChange: (value: boolean) => void
  onFocusMode: () => void
  onShowAllPanels: () => void
  onResetLayout: () => void
}

export type SettingsFieldDefinition = {
  id: string
  label: string
  description: string
  keywords?: string[]
  isAvailable?: (settings: DashboardSettingsContext) => boolean
  render: (settings: DashboardSettingsContext) => ReactNode
}

export type SettingsCategoryDefinition = {
  id: string
  label: string
  description: string
  scope: SettingsScope
  icon: LucideIcon
  fields: SettingsFieldDefinition[]
}

const themeField: SettingsFieldDefinition = {
  id: "color-theme",
  label: "Color theme",
  description: "Choose the color scheme used across the Orbit workspace.",
  keywords: ["light", "dark", "system", "appearance"],
  render: ({ theme, setTheme }) => (
    <SettingRow
      label="Color theme"
      description="Choose the color scheme used across the workspace."
    >
      <div className="flex flex-wrap justify-end gap-1.5">
        {(
          [
            ["light", "Light", Sun],
            ["dark", "Dark", Moon],
            ["system", "System", Monitor],
          ] as const
        ).map(([value, label, Icon]) => (
          <Button
            key={value}
            type="button"
            size="sm"
            variant={theme === value ? "default" : "outline"}
            className="h-8 gap-1.5 px-2.5"
            aria-pressed={theme === value}
            onClick={() => setTheme(value)}
          >
            <Icon className="size-3.5" />
            {label}
          </Button>
        ))}
      </div>
    </SettingRow>
  ),
}

const compactField: SettingsFieldDefinition = {
  id: "compact-density",
  label: "Compact density",
  description: "Use tighter spacing in the dashboard and tool surfaces.",
  keywords: ["dense", "spacing", "comfortable"],
  render: ({ compact, onCompactChange }) => (
    <ToggleSetting
      id="setting-compact-density"
      label="Compact density"
      description="Use tighter spacing in the dashboard and tool surfaces."
      checked={compact}
      onChange={onCompactChange}
    />
  ),
}

const statusBarField: SettingsFieldDefinition = {
  id: "status-bar",
  label: "Status bar",
  description: "Show the workspace status bar at the bottom of the window.",
  keywords: ["footer", "bottom bar", "status"],
  render: ({ showStatusBar, onStatusBarChange }) => (
    <ToggleSetting
      id="setting-status-bar"
      label="Show status bar"
      description="Keep workspace and active-tool status visible at the bottom."
      checked={showStatusBar}
      onChange={onStatusBarChange}
    />
  ),
}

const sidebarWidthField: SettingsFieldDefinition = {
  id: "explorer-width",
  label: "Explorer width",
  description: "Set the width of the left Explorer sidebar.",
  keywords: ["sidebar", "resize", "panel width"],
  render: ({ sidebarWidth, onSidebarWidthChange }) => (
    <RangeSetting
      id="setting-explorer-width"
      label="Explorer width"
      description="Drag the panel edge or adjust its width here."
      value={sidebarWidth}
      min={appConfig.minSidebarWidth}
      max={appConfig.maxSidebarWidth}
      step={8}
      format={(value) => `${value}px`}
      onChange={onSidebarWidthChange}
    />
  ),
}

const activityRailField: SettingsFieldDefinition = {
  id: "activity-rail-visible",
  label: "Activity Rail",
  description: "Show the Activity Rail on the far left of the workspace.",
  keywords: ["left rail", "navigation", "sidebar"],
  render: ({ activityRailVisible, onActivityRailVisibleChange }) => (
    <ToggleSetting
      id="setting-activity-rail"
      label="Show Activity Rail"
      description="Show the Activity Rail on the far left of the workspace."
      checked={activityRailVisible}
      onChange={onActivityRailVisibleChange}
    />
  ),
}

const explorerVisibilityField: SettingsFieldDefinition = {
  id: "explorer-visible",
  label: "Explorer sidebar",
  description: "Show or hide the Explorer sidebar next to the Activity Rail.",
  keywords: ["left sidebar", "navigation", "panel"],
  render: ({ sidebarVisible, onSidebarVisibleChange }) => (
    <ToggleSetting
      id="setting-explorer-visible"
      label="Show Explorer sidebar"
      description="Show or hide the Explorer sidebar next to the Activity Rail."
      checked={sidebarVisible}
      onChange={onSidebarVisibleChange}
    />
  ),
}

const sidebarViewField: SettingsFieldDefinition = {
  id: "sidebar-view",
  label: "Sidebar view",
  description: "Choose which navigation list is shown in the Explorer sidebar.",
  keywords: ["explorer", "pinned", "recent", "navigation"],
  render: ({ sidebarView, onSidebarViewChange }) => (
    <SettingRow
      label="Sidebar view"
      description="Choose which navigation list is shown in the Explorer sidebar."
    >
      <div className="flex gap-1">
        {(
          [
            ["explorer", "Explorer"],
            ["pinned", "Pinned"],
            ["recent", "Recent"],
          ] as const
        ).map(([value, label]) => (
          <Button
            key={value}
            type="button"
            size="sm"
            variant={sidebarView === value ? "secondary" : "ghost"}
            aria-pressed={sidebarView === value}
            onClick={() => onSidebarViewChange(value)}
          >
            {label}
          </Button>
        ))}
      </div>
    </SettingRow>
  ),
}

const explorerCollapsedField: SettingsFieldDefinition = {
  id: "explorer-collapsed",
  label: "Explorer icon mode",
  description: "Keep the Explorer visible in its compact icon-only state.",
  keywords: ["collapse", "expand", "icons"],
  render: ({ sidebarCollapsed, onSidebarCollapsedChange, sidebarVisible }) => (
    <ToggleSetting
      id="setting-explorer-collapsed"
      label="Collapse Explorer to icons"
      description="Keep the Explorer visible in its compact icon-only state."
      checked={sidebarCollapsed}
      disabled={!sidebarVisible}
      onChange={onSidebarCollapsedChange}
    />
  ),
}

const rightPanelField: SettingsFieldDefinition = {
  id: "right-panel-visible",
  label: "Right panel",
  description: "Open or close the active tool's optional right panel.",
  keywords: ["dock", "panel", "visibility"],
  isAvailable: ({ rightPanelAvailable }) => rightPanelAvailable,
  render: ({ rightPanelOpen, onRightPanelOpenChange }) => (
    <ToggleSetting
      id="setting-right-panel"
      label="Show right panel"
      description="Open or close this tool's optional right panel."
      checked={rightPanelOpen}
      onChange={onRightPanelOpenChange}
    />
  ),
}

const bottomPanelField: SettingsFieldDefinition = {
  id: "bottom-panel-visible",
  label: "Bottom panel",
  description: "Open or close the active tool's optional bottom panel.",
  keywords: ["dock", "panel", "terminal", "visibility"],
  isAvailable: ({ bottomPanelAvailable }) => bottomPanelAvailable,
  render: ({ bottomPanelOpen, onBottomPanelOpenChange }) => (
    <ToggleSetting
      id="setting-bottom-panel"
      label="Show bottom panel"
      description="Open or close this tool's optional bottom panel."
      checked={bottomPanelOpen}
      onChange={onBottomPanelOpenChange}
    />
  ),
}

const centeredContentField: SettingsFieldDefinition = {
  id: "centered-content",
  label: "Center content",
  description: "Constrain and center the main tool content area.",
  keywords: ["editor", "width", "alignment"],
  render: ({ centeredContent, onCenteredContentChange }) => (
    <ToggleSetting
      id="setting-centered-content"
      label="Center content"
      description="Constrain and center the main tool content area."
      checked={centeredContent}
      onChange={onCenteredContentChange}
    />
  ),
}

const rightPanelWidthField: SettingsFieldDefinition = {
  id: "right-panel-width",
  label: "Right panel width",
  description: "Set the width of the active tool's right panel.",
  keywords: ["dock", "resize", "panel width"],
  isAvailable: ({ rightPanelAvailable }) => rightPanelAvailable,
  render: ({ rightPanelWidth, onRightPanelWidthChange }) => (
    <RangeSetting
      id="setting-right-panel-width"
      label="Right panel width"
      description="Drag the panel edge or adjust its width here."
      value={rightPanelWidth}
      min={appConfig.minRightPanelWidth}
      max={appConfig.maxRightPanelWidth}
      step={8}
      format={(value) => `${value}px`}
      onChange={onRightPanelWidthChange}
    />
  ),
}

const bottomPanelHeightField: SettingsFieldDefinition = {
  id: "bottom-panel-height",
  label: "Bottom panel height",
  description: "Set the height of the active tool's bottom panel.",
  keywords: ["dock", "resize", "panel height"],
  isAvailable: ({ bottomPanelAvailable }) => bottomPanelAvailable,
  render: ({ bottomPanelHeight, onBottomPanelHeightChange }) => (
    <RangeSetting
      id="setting-bottom-panel-height"
      label="Bottom panel height"
      description="Drag the panel edge or adjust its height here."
      value={bottomPanelHeight}
      min={appConfig.minBottomPanelHeight}
      max={appConfig.maxBottomPanelHeight}
      step={8}
      format={(value) => `${value}px`}
      onChange={onBottomPanelHeightChange}
    />
  ),
}

const resetLayoutField: SettingsFieldDefinition = {
  id: "reset-layout",
  label: "Reset layout",
  description: "Restore the default panel sizes and visibility settings.",
  keywords: ["defaults", "restore", "reset"],
  render: ({ onResetLayout }) => (
    <SettingRow
      label="Reset layout"
      description="Restore the default panel sizes and visibility settings."
    >
      <Button type="button" variant="outline" size="sm" onClick={onResetLayout}>
        <RotateCcw className="size-3.5" />
        Reset layout
      </Button>
    </SettingRow>
  ),
}

const focusModeField: SettingsFieldDefinition = {
  id: "focus-mode",
  label: "Focus Mode",
  description:
    "Hide surrounding panels and status for a distraction-free view.",
  keywords: ["distraction free", "hide panels", "focus"],
  render: ({ onFocusMode }) => (
    <SettingRow
      label="Focus Mode"
      description="Hide surrounding panels and status for a distraction-free view."
    >
      <Button type="button" variant="outline" size="sm" onClick={onFocusMode}>
        <Maximize2 className="size-3.5" />
        Enable
      </Button>
    </SettingRow>
  ),
}

const showAllPanelsField: SettingsFieldDefinition = {
  id: "show-all-panels",
  label: "Show all panels",
  description:
    "Restore the Activity Rail, Explorer, and available tool panels.",
  keywords: ["restore", "show", "panels", "workbench"],
  render: ({ onShowAllPanels }) => (
    <SettingRow
      label="Show all panels"
      description="Restore the Activity Rail, Explorer, and available tool panels."
    >
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={onShowAllPanels}
      >
        <PanelsTopLeft className="size-3.5" />
        Show all
      </Button>
    </SettingRow>
  ),
}

export const dashboardSettingsCategories: SettingsCategoryDefinition[] = [
  {
    id: "common",
    label: "Commonly Used",
    description: "Frequently adjusted workspace preferences.",
    scope: "user",
    icon: Sparkles,
    fields: [themeField, compactField, statusBarField, sidebarWidthField],
  },
  {
    id: "appearance",
    label: "Appearance",
    description: "Theme and density preferences.",
    scope: "user",
    icon: Monitor,
    fields: [themeField, compactField],
  },
  {
    id: "workbench",
    label: "Workbench",
    description: "Control the visibility and behavior of workspace panels.",
    scope: "workspace",
    icon: PanelsTopLeft,
    fields: [
      activityRailField,
      sidebarViewField,
      explorerVisibilityField,
      explorerCollapsedField,
      rightPanelField,
      bottomPanelField,
      centeredContentField,
      statusBarField,
    ],
  },
  {
    id: "layout",
    label: "Layout",
    description: "Tune panel dimensions and restore the default layout.",
    scope: "workspace",
    icon: LayoutDashboard,
    fields: [
      sidebarWidthField,
      rightPanelWidthField,
      bottomPanelHeightField,
      focusModeField,
      showAllPanelsField,
      resetLayoutField,
    ],
  },
]

function SettingRow({
  label,
  description,
  children,
}: {
  label: string
  description: string
  children: ReactNode
}) {
  return (
    <div className="flex items-center justify-between gap-6 border-b border-border/60 py-4 last:border-b-0">
      <div className="min-w-0 space-y-1">
        <p className="text-[13px] font-medium text-foreground">{label}</p>
        <p className="text-xs leading-relaxed text-muted-foreground">
          {description}
        </p>
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  )
}

function ToggleSetting({
  id,
  label,
  description,
  checked,
  disabled = false,
  onChange,
}: {
  id: string
  label: string
  description: string
  checked: boolean
  disabled?: boolean
  onChange: (value: boolean) => void
}) {
  return (
    <SettingRow label={label} description={description}>
      <Switch
        id={id}
        checked={checked}
        disabled={disabled}
        onCheckedChange={onChange}
        aria-label={label}
      />
    </SettingRow>
  )
}

function RangeSetting({
  id,
  label,
  description,
  value,
  min,
  max,
  step,
  format,
  onChange,
}: {
  id: string
  label: string
  description: string
  value: number
  min: number
  max: number
  step: number
  format: (value: number) => string
  onChange: (value: number) => void
}) {
  return (
    <SettingRow label={label} description={description}>
      <div className="w-48 space-y-1">
        <div className="text-right text-xs text-muted-foreground tabular-nums">
          {format(value)}
        </div>
        <Label htmlFor={id} className="sr-only">
          {label}
        </Label>
        <Input
          id={id}
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(event) => onChange(Number(event.target.value))}
          className="h-5 cursor-ew-resize border-0 px-0 shadow-none"
        />
      </div>
    </SettingRow>
  )
}
