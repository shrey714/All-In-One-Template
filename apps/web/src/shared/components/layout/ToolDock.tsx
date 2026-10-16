import type { ComponentType } from "react"
import { X } from "lucide-react"
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
      className="flex h-full min-h-0 w-full min-w-0 flex-col overflow-hidden bg-background"
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
      <div className="min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain p-3">
        <Panel {...context} />
      </div>
    </section>
  )
}
