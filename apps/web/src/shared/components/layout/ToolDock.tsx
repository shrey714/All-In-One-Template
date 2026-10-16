import type { ComponentType, PointerEvent as ReactPointerEvent } from "react"
import { GripHorizontal, GripVertical, X } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import type { ToolContext } from "@/shared/types/tool"

type DockPanelConfig = {
  title: string
  component: ComponentType<ToolContext>
}

export function ToolDock({
  panel,
  context,
  orientation,
  onClose,
}: {
  panel: DockPanelConfig
  context: ToolContext
  orientation: "right" | "bottom"
  onClose: () => void
}) {
  const Panel = panel.component
  return (
    <section
      aria-label={panel.title}
      data-dock={orientation}
      className="flex min-h-0 min-w-0 flex-col overflow-hidden bg-background"
    >
      <header className="flex h-9 shrink-0 items-center justify-between border-b px-3">
        <h2 className="truncate text-xs font-semibold">{panel.title}</h2>
        <Button
          variant="ghost"
          size="icon-xs"
          className="size-7"
          aria-label={`Close ${panel.title}`}
          title={`Close ${panel.title}`}
          onClick={onClose}
        >
          <X className="size-3.5" />
        </Button>
      </header>
      <div className="min-h-0 flex-1 overflow-auto p-3">
        <Panel {...context} />
      </div>
    </section>
  )
}

export function DockResizeHandle({
  orientation,
  size,
  min,
  max,
  onResize,
  onPointerDown,
}: {
  orientation: "vertical" | "horizontal"
  size: number
  min: number
  max: number
  onResize: (size: number) => void
  onPointerDown: (event: ReactPointerEvent<HTMLDivElement>) => void
}) {
  const horizontal = orientation === "horizontal"
  const decrement = horizontal ? -16 : -16
  const increment = 16
  return (
    <div
      role="separator"
      aria-label={`Resize ${horizontal ? "bottom" : "right"} panel`}
      aria-orientation={orientation}
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuenow={size}
      aria-valuetext={`${size} pixels`}
      title={`Drag to resize · Arrow keys to adjust`}
      tabIndex={0}
      onPointerDown={onPointerDown}
      onKeyDown={(event) => {
        const negative = horizontal ? "ArrowUp" : "ArrowLeft"
        const positive = horizontal ? "ArrowDown" : "ArrowRight"
        if (event.key === negative) {
          event.preventDefault()
          onResize(Math.max(min, size + decrement))
        } else if (event.key === positive) {
          event.preventDefault()
          onResize(Math.min(max, size + increment))
        } else if (event.key === "Home") {
          event.preventDefault()
          onResize(min)
        } else if (event.key === "End") {
          event.preventDefault()
          onResize(max)
        }
      }}
      className={`group relative z-10 flex shrink-0 touch-none justify-center outline-none ${horizontal ? "h-[3px] cursor-row-resize" : "w-[3px] cursor-col-resize"}`}
    >
      <span
        className={`pointer-events-none absolute rounded-full bg-border opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100 ${horizontal ? "inset-x-2 top-1/2 h-0.5 -translate-y-1/2" : "inset-y-2 left-1/2 w-0.5 -translate-x-1/2"}`}
      />
      <span className="pointer-events-none absolute top-1/2 left-1/2 grid size-6 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-md border bg-background text-muted-foreground opacity-0 shadow-sm transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
        {horizontal ? (
          <GripHorizontal className="size-4" />
        ) : (
          <GripVertical className="size-4" />
        )}
      </span>
    </div>
  )
}
