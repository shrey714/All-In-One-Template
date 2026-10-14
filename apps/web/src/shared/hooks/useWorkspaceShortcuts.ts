import { useEffect } from "react"

type WorkspaceShortcuts = { search: () => void; toggleSidebar: () => void; settings: () => void; help: () => void }
function isTyping(target: EventTarget | null) {
  return target instanceof HTMLElement && (target.isContentEditable || Boolean(target.closest("input, textarea, select, [contenteditable='true']")))
}
export function useWorkspaceShortcuts(actions: WorkspaceShortcuts) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase()
      const mod = event.metaKey || event.ctrlKey
      if (mod && key === "k") { event.preventDefault(); actions.search(); return }
      if (mod && key === "b") { event.preventDefault(); actions.toggleSidebar(); return }
      if (mod && key === ",") { event.preventDefault(); actions.settings(); return }
      if (!mod && key === "?" && !isTyping(event.target)) { event.preventDefault(); actions.help() }
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [actions])
}
