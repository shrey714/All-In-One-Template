import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@workspace/ui/components/dialog"
import { Kbd } from "@workspace/ui/components/kbd"

const shortcuts = [
  ["Open global search", "⌘ K / Ctrl K"],
  ["Collapse or expand sidebar", "⌘ B / Ctrl B"],
  ["Open configuration manager", "⌘ , / Ctrl ,"],
  ["Open this shortcut guide", "?"],
  ["Close an open dialog", "Esc"],
  ["Move through search results", "↑  ↓  Enter"],
]
type Props = { open: boolean; onOpenChange: (open: boolean) => void }
export function ShortcutHelpDialog({ open, onOpenChange }: Props) {
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="sm:max-w-lg"><DialogHeader><DialogTitle>Keyboard shortcuts</DialogTitle><DialogDescription>Fast paths for common workspace actions.</DialogDescription></DialogHeader><div className="divide-y rounded-xl border px-4">{shortcuts.map(([label, keys]) => <div key={label} className="flex items-center justify-between gap-5 py-3 text-sm"><span>{label}</span><Kbd>{keys}</Kbd></div>)}</div></DialogContent></Dialog>
}
