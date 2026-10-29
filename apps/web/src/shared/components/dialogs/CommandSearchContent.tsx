import { useNavigate } from "react-router-dom"
import {
  ArrowRight,
  Command as CommandIcon,
  Home,
  Settings2,
} from "lucide-react"
import {
  Command as CommandPalette,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
} from "@workspace/ui/components/command"
import { domains } from "@/shared/config/registry"
import { AppIcon } from "@/shared/components/display/AppIcon"

type Props = {
  onClose: () => void
  onOpenSettings: () => void
}

export function CommandSearchContent({ onClose, onOpenSettings }: Props) {
  const navigate = useNavigate()
  const go = (path: string) => {
    navigate(path)
    onClose()
  }

  return (
    <CommandPalette className="min-h-0 rounded-lg! bg-transparent p-1">
      <CommandInput placeholder="Search domains, tools, and pages…" autoFocus />
      <CommandList className="max-h-[min(28rem,calc(100dvh-8rem))]">
        <CommandEmpty>No matching tools or pages.</CommandEmpty>
        <CommandGroup heading="Workspace">
          <CommandItem value="overview dashboard home" onSelect={() => go("/")}>
            <Home />
            Overview
            <CommandShortcut>⌘1</CommandShortcut>
          </CommandItem>
          <CommandItem
            value="settings configuration preferences"
            onSelect={() => {
              onClose()
              onOpenSettings()
            }}
          >
            <Settings2 />
            Open settings
            <CommandShortcut>⌘,</CommandShortcut>
          </CommandItem>
        </CommandGroup>
        {domains.map((domain) => {
          return (
            <CommandGroup key={domain.id} heading={domain.name}>
              <CommandItem
                value={`${domain.name} ${domain.description}`}
                onSelect={() => go(`/domains/${domain.id}`)}
              >
                <AppIcon icon={domain.icon} className="size-4" />
                {domain.name}
                <CommandShortcut>
                  <ArrowRight className="size-3" />
                </CommandShortcut>
              </CommandItem>
              {domain.tools.map((tool) => {
                return (
                  <CommandItem
                    key={tool.id}
                    value={`${domain.name} ${tool.name} ${tool.description}`}
                    onSelect={() => go(tool.href)}
                  >
                    <AppIcon icon={tool.icon} className="size-4" />
                    {tool.name}
                    <CommandShortcut>{domain.name}</CommandShortcut>
                  </CommandItem>
                )
              })}
            </CommandGroup>
          )
        })}
        <CommandGroup heading="Tips">
          <CommandItem
            value="keyboard shortcuts help"
            onSelect={() => {
              onClose()
              window.dispatchEvent(new Event("orbit:open-shortcuts"))
            }}
          >
            <CommandIcon />
            Keyboard shortcuts
            <CommandShortcut>?</CommandShortcut>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandPalette>
  )
}
