import { useEffect, useState } from "react"
import type { PinnedToolInput } from "@/shared/services/pinned-tools"

const STORAGE_KEY = "orbit.workspace.favorite-tools"
const CHANGE_EVENT = "orbit:favorite-tools-changed"
type FavoriteToolRecord = Pick<PinnedToolInput, "domainId" | "toolId">
let fallbackFavorites: FavoriteToolRecord[] = []

function readFavorites(): FavoriteToolRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw === null) return fallbackFavorites
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter(
      (item): item is FavoriteToolRecord =>
        Boolean(item) &&
        typeof item.domainId === "string" &&
        typeof item.toolId === "string"
    )
  } catch {
    return fallbackFavorites
  }
}

function writeFavorites(favorites: FavoriteToolRecord[]) {
  fallbackFavorites = favorites
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites))
  } catch {
    // Preserve the preference for the current browser session when storage is restricted.
  }
  window.dispatchEvent(new Event(CHANGE_EVENT))
}

export function isToolFavorite(
  favorites: FavoriteToolRecord[],
  tool: FavoriteToolRecord
) {
  return favorites.some(
    (item) => item.domainId === tool.domainId && item.toolId === tool.toolId
  )
}

export function toggleFavoriteTool(tool: FavoriteToolRecord) {
  const favorites = readFavorites()
  const exists = isToolFavorite(favorites, tool)
  writeFavorites(
    exists
      ? favorites.filter(
          (item) =>
            item.domainId !== tool.domainId || item.toolId !== tool.toolId
        )
      : [tool, ...favorites]
  )
  return !exists
}

export function useFavoriteTools() {
  const [favorites, setFavorites] =
    useState<FavoriteToolRecord[]>(readFavorites)
  useEffect(() => {
    const update = () => setFavorites(readFavorites())
    window.addEventListener(CHANGE_EVENT, update)
    window.addEventListener("storage", update)
    return () => {
      window.removeEventListener(CHANGE_EVENT, update)
      window.removeEventListener("storage", update)
    }
  }, [])
  return favorites
}
