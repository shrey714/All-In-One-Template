import { useCallback, useState, type Dispatch, type SetStateAction } from "react"

export function usePersistentState<T>(key: string, initialValue: T | (() => T)): [T, Dispatch<SetStateAction<T>>] {
  const [value, setValue] = useState<T>(() => {
    try {
      const stored = window.localStorage.getItem(key)
      if (stored !== null) return JSON.parse(stored) as T
    } catch { /* Use the in-memory default when storage is unavailable. */ }
    return typeof initialValue === "function" ? (initialValue as () => T)() : initialValue
  })
  const persist = useCallback<Dispatch<SetStateAction<T>>>((update) => {
    setValue((current) => {
      const next = typeof update === "function" ? (update as (previous: T) => T)(current) : update
      try { window.localStorage.setItem(key, JSON.stringify(next)) } catch { /* Keep the current tab functional without storage. */ }
      return next
    })
  }, [key])
  return [value, persist]
}
