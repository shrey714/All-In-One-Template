import { Monitor, Moon, RotateCcw, Sun } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@workspace/ui/components/dialog"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import { Switch } from "@workspace/ui/components/switch"
import { useTheme } from "@/components/theme-provider"

type Props = { open: boolean; onOpenChange: (open: boolean) => void; compact: boolean; onCompactChange: (value: boolean) => void; showStatusBar: boolean; onStatusBarChange: (value: boolean) => void; sidebarWidth: number; onSidebarWidthChange: (value: number) => void; onResetLayout: () => void }
const themes = [{ id: "light", label: "Light", icon: Sun }, { id: "dark", label: "Dark", icon: Moon }, { id: "system", label: "System", icon: Monitor }] as const
export function ConfigManagerDialog({ open, onOpenChange, compact, onCompactChange, showStatusBar, onStatusBarChange, sidebarWidth, onSidebarWidthChange, onResetLayout }: Props) {
  const { theme, setTheme } = useTheme()
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="sm:max-w-xl"><DialogHeader><DialogTitle>Workspace settings</DialogTitle><DialogDescription>Personalize Orbit. Preferences are saved on this device.</DialogDescription></DialogHeader>
    <section className="space-y-3"><h3 className="text-sm font-semibold">Appearance</h3><div className="grid grid-cols-3 gap-2">{themes.map(({ id, label, icon: Icon }) => <Button key={id} variant={theme === id ? "default" : "outline"} className="h-auto justify-start py-3" onClick={() => setTheme(id)}><Icon className="size-4"/>{label}</Button>)}</div></section>
    <section className="space-y-4 border-t pt-4"><h3 className="text-sm font-semibold">Interface</h3><Preference label="Compact density" detail="Tighter spacing for tool-heavy workspaces." checked={compact} onChange={onCompactChange}/><Preference label="Show status bar" detail="Keep route and workspace status visible at the bottom." checked={showStatusBar} onChange={onStatusBarChange}/><div className="space-y-2"><div className="flex items-center justify-between"><Label htmlFor="sidebar-width">Explorer width</Label><span className="text-xs tabular-nums text-muted-foreground">{sidebarWidth}px</span></div><Input id="sidebar-width" type="range" min={224} max={440} step={8} value={sidebarWidth} onChange={event => onSidebarWidthChange(Number(event.target.value))} className="h-6 cursor-ew-resize border-0 px-0 shadow-none"/><p className="text-xs text-muted-foreground">Drag the panel edge or tune its width here.</p></div></section>
    <section className="flex items-center justify-between gap-4 border-t pt-4"><div><h3 className="text-sm font-semibold">Layout</h3><p className="text-xs text-muted-foreground">Reset sidebar width and collapsed state.</p></div><Button variant="outline" size="sm" onClick={onResetLayout}><RotateCcw className="size-3.5"/>Reset layout</Button></section>
  </DialogContent></Dialog>
}
function Preference({ label, detail, checked, onChange }: { label: string; detail: string; checked: boolean; onChange: (value: boolean) => void }) { const id = `setting-${label.toLowerCase().replaceAll(" ", "-")}`; return <div className="flex items-center justify-between gap-5"><div className="space-y-1"><Label htmlFor={id}>{label}</Label><p className="text-xs text-muted-foreground">{detail}</p></div><Switch id={id} checked={checked} onCheckedChange={onChange}/></div> }
