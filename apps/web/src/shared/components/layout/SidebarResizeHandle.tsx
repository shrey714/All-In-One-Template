import type { KeyboardEvent, PointerEvent as ReactPointerEvent } from "react"
import { Ellipsis, EllipsisVertical } from "lucide-react"

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
      className={`group relative z-20 flex shrink-0 touch-none justify-center outline-none ${horizontal ? "h-1 cursor-row-resize" : "w-1 cursor-col-resize"} before:absolute before:rounded-lg before:content-[''] ${horizontal ? "before:inset-x-2 before:top-1/2 before:h-1 before:-translate-y-1/2" : "before:inset-y-2 before:left-1/2 before:w-1 before:-translate-x-1/2"} hover:before:bg-primary focus-visible:before:bg-primary before:duration-200`}
    >
        <span className="self-center text-border">
        {horizontal ? (
          <Ellipsis className="size-4" />
        ) : (
          <EllipsisVertical className="size-4" />
        )}
      </span>


    </div>
  )
}
// bg-primary