import { NavLink } from "react-router-dom"
import { Clock3, Command, FolderTree, Star } from "lucide-react"
import { Button } from "@workspace/ui/components/button"

export type SidebarView = "explorer" | "pinned" | "recent"
type Props = { view: SidebarView; onViewChange: (view: SidebarView) => void }

const views = [
  { id: "explorer", label: "Explorer", icon: FolderTree },
  { id: "pinned", label: "Pinned tools", icon: Star },
  { id: "recent", label: "Recent tools", icon: Clock3 },
] as const

export function ActivityRail({ view, onViewChange }: Props) {
  return (
    <nav
      aria-label="Workspace views"
      className="ml-1 my-1 flex w-12 shrink-0 flex-col items-center border border-r-0 border-border py-3
      overflow-hidden rounded-l-md
      "
    >
      <NavLink
        end
        aria-label="Go to dashboard"
        title="Dashboard"
        to="/"
        className={({ isActive }) =>
          `mb-5 grid size-9 place-items-center rounded-xl transition-colors ${isActive ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-muted"}`
        }
        onClick={() => onViewChange("explorer")}
      >
        <Command className="size-4" />
      </NavLink>
      <div className="flex flex-col items-center gap-1.5">
        {views.map(({ id, label, icon: Icon }) => (
          <Button
            key={id}
            variant="ghost"
            size="icon"
            title={label}
            aria-label={label}
            aria-pressed={view === id}
            onClick={() => onViewChange(id)}
            className={
              view === id
                ? "bg-primary/10 text-primary hover:bg-primary/15 hover:text-primary"
                : "text-muted-foreground"
            }
          >
            <Icon className="size-4" />
          </Button>
        ))}
      </div>
      <span className="flex-1" />
      <span
        className="mb-2 size-1.5 rounded-full bg-emerald-500"
        title="Workspace ready"
        aria-label="Workspace ready"
      />
    </nav>
  )
}
