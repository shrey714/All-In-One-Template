import { useNavigate } from "react-router-dom"
import { ArrowRight, Command as CommandIcon, Home, Settings2 } from "lucide-react"
import { CommandDialog, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem, CommandShortcut, Command as CommandPalette } from "@workspace/ui/components/command"
import { domains } from "@/shared/config/registry"

type Props = { open: boolean; onOpenChange: (open: boolean) => void; onOpenSettings: () => void }
export function CommandSearchDialog({ open, onOpenChange, onOpenSettings }: Props) {
  const navigate = useNavigate()
  const go = (path: string) => { navigate(path); onOpenChange(false) }
  return <CommandDialog open={open} onOpenChange={onOpenChange} title="Search Orbit" description="Find a page, domain, or tool.">
    <CommandPalette><CommandInput placeholder="Search domains, tools, and pages…" autoFocus/><CommandList><CommandEmpty>No matching tools or pages.</CommandEmpty>
      <CommandGroup heading="Workspace"><CommandItem value="overview dashboard home" onSelect={() => go("/")}><Home/>Overview<CommandShortcut>⌘1</CommandShortcut></CommandItem><CommandItem value="settings configuration preferences" onSelect={() => { onOpenChange(false); onOpenSettings() }}><Settings2/>Open settings<CommandShortcut>⌘,</CommandShortcut></CommandItem></CommandGroup>
      {domains.map(domain => { const DomainIcon = domain.icon; return <CommandGroup key={domain.id} heading={domain.name}><CommandItem value={`${domain.name} ${domain.description}`} onSelect={() => go(`/domains/${domain.id}`)}><DomainIcon/>{domain.name}<CommandShortcut><ArrowRight className="size-3"/></CommandShortcut></CommandItem>{domain.tools.map(tool => { const ToolIcon = tool.icon; return <CommandItem key={tool.id} value={`${domain.name} ${tool.name} ${tool.description}`} onSelect={() => go(tool.href)}><ToolIcon/>{tool.name}<CommandShortcut>{domain.name}</CommandShortcut></CommandItem> })}</CommandGroup> })}
      <CommandGroup heading="Tips"><CommandItem value="keyboard shortcuts help" onSelect={() => { onOpenChange(false); window.dispatchEvent(new Event("orbit:open-shortcuts")) }}><CommandIcon/>Keyboard shortcuts<CommandShortcut>?</CommandShortcut></CommandItem></CommandGroup>
    </CommandList></CommandPalette>
  </CommandDialog>
}
