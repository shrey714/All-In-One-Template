import { useEffect, useState } from "react"
export type RecentToolRecord = { domainId: string; toolId: string; href: string; openedAt: number }
const STORAGE_KEY = "orbit.workspace.recent-tools"
const MAX_RECENT = 8
function readRecent(): RecentToolRecord[] { try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]") as RecentToolRecord[] } catch { return [] } }
function broadcast() { window.dispatchEvent(new Event("orbit:recent-tools-changed")) }
export function recordRecentTool(tool: Omit<RecentToolRecord, "openedAt">) { try { const current = readRecent().filter(item => item.href !== tool.href); localStorage.setItem(STORAGE_KEY, JSON.stringify([{ ...tool, openedAt: Date.now() }, ...current].slice(0, MAX_RECENT))) } catch { /* Continue without a persistent history in restricted contexts. */ } broadcast() }
export function clearRecentTools() { try { localStorage.removeItem(STORAGE_KEY) } catch { /* History is still cleared in the current app view. */ } broadcast() }
export function useRecentTools() {
  const [recentTools, setRecentTools] = useState<RecentToolRecord[]>(readRecent)
  useEffect(() => { const update = () => setRecentTools(readRecent()); window.addEventListener("orbit:recent-tools-changed", update); window.addEventListener("storage", update); return () => { window.removeEventListener("orbit:recent-tools-changed", update); window.removeEventListener("storage", update) } }, [])
  return recentTools
}
