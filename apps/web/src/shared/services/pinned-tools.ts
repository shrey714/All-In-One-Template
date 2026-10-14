import { useEffect, useState } from "react"

export type PinnedToolRecord = {
  domainId: string
  toolId: string
  href: string
  pinnedAt: number
}

export type PinnedToolInput = Pick<
  PinnedToolRecord,
  "domainId" | "toolId" | "href"
>

const STORAGE_KEY = "orbit.workspace.pinned-tools"
const CHANGE_EVENT = "orbit:pinned-tools-changed"
let fallbackPins: PinnedToolRecord[] = []

function readPinnedTools(): PinnedToolRecord[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === null) return fallbackPins
    const parsed: unknown = JSON.parse(stored)
    if (!Array.isArray(parsed)) return []
    return parsed.filter(
      (item): item is PinnedToolRecord =>
        Boolean(item) &&
        typeof item.domainId === "string" &&
        typeof item.toolId === "string" &&
        typeof item.href === "string" &&
        typeof item.pinnedAt === "number"
    )
  } catch {
    return fallbackPins
  }
}

function notifyPinnedToolsChanged() {
  window.dispatchEvent(new Event(CHANGE_EVENT))
}

function writePinnedTools(pins: PinnedToolRecord[]) {
  fallbackPins = pins
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(pins))
  } catch {
    // Keep the current-session preference available when browser storage is restricted.
  }
  notifyPinnedToolsChanged()
}

export function togglePinnedTool(tool: PinnedToolInput): boolean {
  const current = readPinnedTools()
  const exists = current.some(
    (item) => item.domainId === tool.domainId && item.toolId === tool.toolId
  )
  const next = exists
    ? current.filter(
        (item) => item.domainId !== tool.domainId || item.toolId !== tool.toolId
      )
    : [{ ...tool, pinnedAt: Date.now() }, ...current]
  writePinnedTools(next)
  return !exists
}

export function isToolPinned(
  pins: PinnedToolRecord[],
  tool: PinnedToolInput
): boolean {
  return pins.some(
    (item) => item.domainId === tool.domainId && item.toolId === tool.toolId
  )
}

export function usePinnedTools() {
  const [pinnedTools, setPinnedTools] =
    useState<PinnedToolRecord[]>(readPinnedTools)

  useEffect(() => {
    const update = () => setPinnedTools(readPinnedTools())
    window.addEventListener(CHANGE_EVENT, update)
    window.addEventListener("storage", update)
    return () => {
      window.removeEventListener(CHANGE_EVENT, update)
      window.removeEventListener("storage", update)
    }
  }, [])

  return pinnedTools
}
