import type { KeyboardEvent, PointerEvent as ReactPointerEvent } from "react"
import { GripVertical } from "lucide-react"

type Props = {
  width: number
  min: number
  max: number
  onPointerDown: (event: ReactPointerEvent<HTMLDivElement>) => void
  onWidthChange: (width: number) => void
  onToggle: () => void
}

export function SidebarResizeHandle({
  width,
  min,
  max,
  onPointerDown,
  onWidthChange,
  onToggle,
}: Props) {
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "ArrowLeft") {
      event.preventDefault()
      onWidthChange(Math.max(min, width - 16))
    } else if (event.key === "ArrowRight") {
      event.preventDefault()
      onWidthChange(Math.min(max, width + 16))
    } else if (event.key === "Home") {
      event.preventDefault()
      onWidthChange(min)
    } else if (event.key === "End") {
      event.preventDefault()
      onWidthChange(max)
    } else if (event.key === "Enter") {
      event.preventDefault()
      onToggle()
    }
  }

  return (
    <div
      role="separator"
      aria-label="Resize Explorer pane"
      aria-controls="workspace-sidebar"
      aria-orientation="vertical"
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuenow={width}
      aria-valuetext={`${width} pixels`}
      title="Drag to resize · Arrow keys to adjust · Enter to collapse"
      tabIndex={0}
      onPointerDown={onPointerDown}
      onKeyDown={onKeyDown}
      className="group relative z-20 flex shrink-0 cursor-col-resize touch-none justify-center outline-none before:absolute before:inset-y-2 before:left-1/2 before:w-[3px] before:-translate-x-1/2 before:border-x before:border-double before:border-transparent before:content-[''] hover:before:border-primary focus-visible:before:border-primary"
    >
      <span className="pointer-events-none absolute top-1/2 left-1/2 grid size-6 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-md border border-border bg-background text-muted-foreground opacity-0 shadow-sm transition-all duration-150 group-hover:border-primary/50 group-hover:bg-card group-hover:text-primary group-hover:opacity-100 group-hover:shadow-md group-hover:ring-2 group-hover:ring-primary/20 group-focus-visible:border-primary/50 group-focus-visible:text-primary group-focus-visible:opacity-100 group-focus-visible:shadow-md group-focus-visible:ring-2 group-focus-visible:ring-primary/20">
        <GripVertical className="size-4" />
      </span>
    </div>
  )
}
