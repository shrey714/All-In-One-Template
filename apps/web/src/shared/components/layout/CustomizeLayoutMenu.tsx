import { Maximize2, PanelsRightBottom, RotateCcw } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"

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
}

export function CustomizeLayoutMenu(props: Props) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          className="size-7 rounded-sm"
          aria-label="Customize Layout"
          title="Customize Layout"
        >
          <PanelsRightBottom className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={8} className="min-w-56">
        <DropdownMenuLabel>Visibility</DropdownMenuLabel>
        <DropdownMenuCheckboxItem
          checked={props.activityRailVisible}
          onCheckedChange={props.onActivityRailVisibleChange}
        >
          Activity Rail
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem
          checked={props.sidebarVisible}
          onCheckedChange={props.onSidebarVisibleChange}
        >
          Explorer sidebar
        </DropdownMenuCheckboxItem>
        {props.rightPanelAvailable && (
          <DropdownMenuCheckboxItem
            checked={props.rightPanelOpen}
            onCheckedChange={(checked) =>
              props.onRightPanelChange(checked === true)
            }
          >
            Right panel
          </DropdownMenuCheckboxItem>
        )}
        {props.bottomPanelAvailable && (
          <DropdownMenuCheckboxItem
            checked={props.bottomPanelOpen}
            onCheckedChange={(checked) =>
              props.onBottomPanelChange(checked === true)
            }
          >
            Bottom panel
          </DropdownMenuCheckboxItem>
        )}
        <DropdownMenuCheckboxItem
          checked={props.statusBarVisible}
          onCheckedChange={props.onStatusBarVisibleChange}
        >
          Status bar
        </DropdownMenuCheckboxItem>
        <DropdownMenuSeparator />
        <DropdownMenuLabel>Content</DropdownMenuLabel>
        <DropdownMenuCheckboxItem
          checked={props.centeredContent}
          onCheckedChange={props.onCenteredContentChange}
        >
          Center content
        </DropdownMenuCheckboxItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={props.onFocusMode}>
          <Maximize2 />
          Focus Mode
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={props.onShowAll}>
          Show all panels
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={props.onResetLayout}>
          <RotateCcw />
          Reset Layout
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
