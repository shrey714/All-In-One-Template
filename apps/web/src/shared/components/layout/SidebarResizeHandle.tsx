import type { KeyboardEvent, PointerEvent as ReactPointerEvent } from "react"
import { GripHorizontal, GripVertical } from "lucide-react"

type Panel = "explorer" | "right" | "bottom"
type Props = {
  panel: Panel
  size: number
  min: number
  max: number
  onPointerDown: (event: ReactPointerEvent<HTMLDivElement>) => void
  onResize: (size: number) => void
  onToggle?: () => void
}

const panelLabels: Record<Panel, string> = {
  explorer: "Explorer pane",
  right: "right panel",
  bottom: "bottom panel",
}

export function SidebarResizeHandle({
  panel,
  size,
  min,
  max,
  onPointerDown,
  onResize,
  onToggle,
}: Props) {
  const horizontal = panel === "bottom"
  const increasesToward =
    panel === "explorer"
      ? "ArrowRight"
      : panel === "right"
        ? "ArrowLeft"
        : "ArrowUp"
  const decreasesToward =
    panel === "explorer"
      ? "ArrowLeft"
      : panel === "right"
        ? "ArrowRight"
        : "ArrowDown"

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === increasesToward) {
      event.preventDefault()
      onResize(Math.min(max, size + 16))
    } else if (event.key === decreasesToward) {
      event.preventDefault()
      onResize(Math.max(min, size - 16))
    } else if (event.key === "Home") {
      event.preventDefault()
      onResize(min)
    } else if (event.key === "End") {
      event.preventDefault()
      onResize(max)
    } else if (event.key === "Enter" && onToggle) {
      event.preventDefault()
      onToggle()
    }
  }

  return (
    <div
      role="separator"
      aria-label={`Resize ${panelLabels[panel]}`}
      aria-controls={panel === "explorer" ? "workspace-sidebar" : undefined}
      aria-orientation={horizontal ? "horizontal" : "vertical"}
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuenow={size}
      aria-valuetext={`${size} pixels`}
      title={`Drag to resize · Arrow keys to adjust${onToggle ? " · Enter to collapse" : ""}`}
      tabIndex={0}
      onPointerDown={onPointerDown}
      onKeyDown={onKeyDown}
      className={`group relative z-20 flex shrink-0 touch-none justify-center outline-none ${horizontal ? "h-[3px] cursor-row-resize" : "w-[3px] cursor-col-resize"} before:absolute before:border-x before:border-double before:border-transparent before:content-[''] ${horizontal ? "before:inset-x-2 before:top-1/2 before:h-[3px] before:-translate-y-1/2 before:border-y" : "before:inset-y-2 before:left-1/2 before:w-[3px] before:-translate-x-1/2"} hover:before:border-primary focus-visible:before:border-primary`}
    >
      <span className="pointer-events-none absolute top-1/2 left-1/2 grid size-6 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-md border border-border bg-background text-muted-foreground opacity-0 shadow-sm transition-all duration-150 group-hover:border-primary/50 group-hover:bg-card group-hover:text-primary group-hover:opacity-100 group-hover:shadow-md group-hover:ring-2 group-hover:ring-primary/20 group-focus-visible:border-primary/50 group-focus-visible:bg-card group-focus-visible:text-primary group-focus-visible:opacity-100 group-focus-visible:shadow-md group-focus-visible:ring-2 group-focus-visible:ring-primary/20">
        {horizontal ? (
          <GripHorizontal className="size-4" />
        ) : (
          <GripVertical className="size-4" />
        )}
      </span>
    </div>
  )
}
