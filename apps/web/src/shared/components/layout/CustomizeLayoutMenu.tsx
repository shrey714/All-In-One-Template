import { Check, Eye, Maximize2, RotateCcw } from "lucide-react"
import type { ReactNode } from "react"

type Props = {
  activityRailVisible: boolean
  onActivityRailVisibleChange: (visible: boolean) => void
  sidebarVisible: boolean
  onSidebarVisibleChange: (visible: boolean) => void
  rightPanelAvailable: boolean
  rightPanelOpen: boolean
  onRightPanelChange: (visible: boolean) => void
  bottomPanelAvailable: boolean
  bottomPanelOpen: boolean
  onBottomPanelChange: (visible: boolean) => void
  statusBarVisible: boolean
  onStatusBarVisibleChange: (visible: boolean) => void
  centeredContent: boolean
  onCenteredContentChange: (centered: boolean) => void
  onFocusMode: () => void
  onShowAll: () => void
  onResetLayout: () => void
  onClose: () => void
}

export function CustomizeLayoutMenu(props: Props) {
  const runAndClose = (action: () => void) => {
    action()
    props.onClose()
  }

  return (
    <div className="max-h-[min(32rem,calc(100dvh-4rem))] overflow-y-auto py-2 text-sm">
      <p className="mb-1 w-full text-center text-xs font-medium tracking-wide text-muted-foreground uppercase">
        Customize Layout
      </p>

      <p className="px-2 pt-1.5 text-[11px] font-medium tracking-wide text-muted-foreground">
        Visibility
      </p>
      <div role="group" aria-label="Panel visibility" className="px-2">
        <ToggleRow
          label="Activity Rail"
          checked={props.activityRailVisible}
          onChange={props.onActivityRailVisibleChange}
        />
        <ToggleRow
          label="Explorer sidebar"
          checked={props.sidebarVisible}
          onChange={props.onSidebarVisibleChange}
        />
        {props.rightPanelAvailable && (
          <ToggleRow
            label="Right panel"
            checked={props.rightPanelOpen}
            onChange={props.onRightPanelChange}
          />
        )}
        {props.bottomPanelAvailable && (
          <ToggleRow
            label="Bottom panel"
            checked={props.bottomPanelOpen}
            onChange={props.onBottomPanelChange}
          />
        )}
        <ToggleRow
          label="Status bar"
          checked={props.statusBarVisible}
          onChange={props.onStatusBarVisibleChange}
        />
      </div>

      <p className="px-2 pt-1.5 text-[11px] font-medium tracking-wide text-muted-foreground">
        Content
      </p>
      <div className="px-2">
        <ToggleRow
          label="Center content"
          checked={props.centeredContent}
          onChange={props.onCenteredContentChange}
        />
      </div>

      <div className="my-2 h-px bg-border" />
      <div className="px-2">
        <ActionRow
          label="Focus Mode"
          icon={<Maximize2 className="size-4" />}
          onClick={() => runAndClose(props.onFocusMode)}
        />
        <ActionRow
          label="Show all panels"
          icon={<Eye className="size-4" />}
          onClick={() => runAndClose(props.onShowAll)}
        />
      </div>
      <div className="my-2.5 h-px bg-border" />
      <div className="px-2">
        <ActionRow
          label="Reset Layout"
          icon={<RotateCcw className="size-4" />}
          onClick={() => runAndClose(props.onResetLayout)}
        />
      </div>
    </div>
  )
}

function ToggleRow({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: (checked: boolean) => void
}) {
  return (
    <button
      type="button"
      aria-pressed={checked}
      onClick={() => onChange(!checked)}
      className="flex min-h-8 w-full items-center justify-between gap-3 rounded-md px-2 text-left text-[13px] text-foreground transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
    >
      <span>{label}</span>
      <span
        aria-hidden="true"
        className={`grid size-4 shrink-0 place-items-center rounded border ${checked ? "border-primary bg-primary text-primary-foreground" : "border-input bg-background text-transparent"}`}
      >
        {checked && <Check className="size-3" />}
      </span>
    </button>
  )
}

function ActionRow({
  label,
  icon,
  onClick,
}: {
  label: string
  icon?: ReactNode
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex min-h-8 w-full items-center gap-2 rounded-md px-2 text-left text-[13px] text-foreground transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
    >
      <span className="grid size-4 shrink-0 place-items-center text-muted-foreground">
        {icon}
      </span>
      {label}
    </button>
  )
}
