import { useLocation } from "react-router-dom"
import { Activity, Radio, Settings2 } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import { getTool } from "@/shared/config/registry"

type Props = { onOpenSettings: () => void }

export function WorkspaceStatusBar({ onOpenSettings }: Props) {
  const location = useLocation()
  const parts = location.pathname.split("/").filter(Boolean)
  const tool =
    parts[0] === "domains" && parts[2] === "tools"
      ? getTool(parts[1] ?? "", parts[3] ?? "")
      : undefined

  return (
    <footer className="flex shrink-0 items-center justify-between px-3 pt-1 text-[10px] text-muted-foreground">
      <div className="flex items-center gap-3">
        <span className="flex items-center gap-1">
          <Radio className="size-3 text-emerald-500" />
          Ready
        </span>
        <span className="hidden items-center gap-1 sm:flex">
          <Activity className="size-3" />
          {tool ? tool.name : "Workspace"}
        </span>
      </div>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-6 gap-1 px-1.5 text-[10px]"
        aria-label="Open settings"
        title="Open settings"
        onClick={onOpenSettings}
      >
        <Settings2 className="size-3.5" />
        Settings
      </Button>
    </footer>
  )
}
