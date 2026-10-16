import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react"

type Subscriber = (value: unknown) => void
const subscribersByKey = new Map<string, Set<Subscriber>>()

export function usePersistentState<T>(
  key: string,
  initialValue: T | (() => T)
): [T, Dispatch<SetStateAction<T>>] {
  const [value, setValue] = useState<T>(() => {
    try {
      const stored = window.localStorage.getItem(key)
      if (stored !== null) return JSON.parse(stored) as T
    } catch {
      /* Use the in-memory default when storage is unavailable. */
    }
    return typeof initialValue === "function"
      ? (initialValue as () => T)()
      : initialValue
  })
  const valueRef = useRef(value)

  useEffect(() => {
    const subscriber: Subscriber = (next) => {
      valueRef.current = next as T
      setValue(next as T)
    }
    const subscribers = subscribersByKey.get(key) ?? new Set<Subscriber>()
    subscribers.add(subscriber)
    subscribersByKey.set(key, subscribers)

    return () => {
      subscribers.delete(subscriber)
      if (!subscribers.size) subscribersByKey.delete(key)
    }
  }, [key])

  const persist = useCallback<Dispatch<SetStateAction<T>>>(
    (update) => {
      const next =
        typeof update === "function"
          ? (update as (previous: T) => T)(valueRef.current)
          : update
      valueRef.current = next
      setValue(next)
      try {
        window.localStorage.setItem(key, JSON.stringify(next))
      } catch {
        /* Keep the current tab functional without storage. */
      }
      subscribersByKey.get(key)?.forEach((subscriber) => subscriber(next))
    },
    [key]
  )
  return [value, persist]
}
