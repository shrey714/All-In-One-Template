import { useLocation } from "react-router-dom"
import { Activity, PanelLeft, Radio } from "lucide-react"
import { getTool } from "@/shared/config/registry"

type Props = { collapsed: boolean; width: number }

export function WorkspaceStatusBar({ collapsed, width }: Props) {
  const location = useLocation()
  const parts = location.pathname.split("/").filter(Boolean)
  const tool =
    parts[0] === "domains" && parts[2] === "tools"
      ? getTool(parts[1] ?? "", parts[3] ?? "")
      : undefined

  return (
    <footer className="flex py-1 shrink-0 items-center justify-between px-3 text-[10px] text-muted-foreground">
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
      <span className="flex items-center gap-1">
        <PanelLeft className="size-3" />
        {collapsed ? "Icon sidebar" : `${width}px sidebar`}
      </span>
    </footer>
  )
}
