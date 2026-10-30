import { useEffect, useState } from "react"
import { ApiError } from "@/shared/services/auth-api"
import {
  heartbeatToolPresence,
  leaveToolPresence,
  type ToolPresenceUser,
} from "@/shared/services/presence-api"

type PresenceState = {
  key: string | null
  users: ToolPresenceUser[]
  available: boolean | null
  tabLimitReached: boolean
}

const HEARTBEAT_INTERVAL_MS = 20_000
const HEARTBEAT_TIMEOUT_MS = 10_000
const LEAVE_GRACE_MS = 250
const tabClientIds = new Map<number, string>()
const pendingLeaves = new Map<string, number>()

function cancelPendingLeave(key: string) {
  const timer = pendingLeaves.get(key)
  if (timer === undefined) return
  window.clearTimeout(timer)
  pendingLeaves.delete(key)
}

function scheduleLeave(key: string, leave: () => void) {
  cancelPendingLeave(key)
  const timer = window.setTimeout(() => {
    pendingLeaves.delete(key)
    leave()
  }, LEAVE_GRACE_MS)
  pendingLeaves.set(key, timer)
}

function createClientId() {
  const cryptoApi = window.crypto
  if (typeof cryptoApi.randomUUID === "function") return cryptoApi.randomUUID()

  const bytes = cryptoApi.getRandomValues(new Uint8Array(16))
  bytes[6] = (bytes[6]! & 0x0f) | 0x40
  bytes[8] = (bytes[8]! & 0x3f) | 0x80
  const hex = Array.from(bytes, (value) =>
    value.toString(16).padStart(2, "0")
  ).join("")
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
}

function getTabClientId(userId: number) {
  try {
    const existing = tabClientIds.get(userId)
    if (existing) return existing
    const clientId = createClientId()
    tabClientIds.set(userId, clientId)
    return clientId
  } catch {
    return null
  }
}

export function useToolPresence({
  enabled,
  userId,
  domainId,
  toolId,
}: {
  enabled: boolean
  userId: number | null
  domainId: string
  toolId: string
}) {
  const [state, setState] = useState<PresenceState>({
    key: null,
    users: [],
    available: null,
    tabLimitReached: false,
  })
  const key = `${userId ?? "anonymous"}:${domainId}/${toolId}`

  useEffect(() => {
    let active = true
    let heartbeatInFlight = false
    let heartbeatController: AbortController | null = null
    const clientId = userId === null ? null : getTabClientId(userId)
    if (!enabled || userId === null || !clientId) {
      // The key scopes rendered results to the current account and tool.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setState({ key, users: [], available: false, tabLimitReached: false })
      return
    }
    const leaseKey = `${userId}:${clientId}:${domainId}/${toolId}`
    cancelPendingLeave(leaseKey)

    const heartbeat = async () => {
      if (document.visibilityState !== "visible" || heartbeatInFlight) {
        return
      }
      heartbeatInFlight = true
      const controller = new AbortController()
      heartbeatController = controller
      const timeoutId = window.setTimeout(
        () => controller.abort(),
        HEARTBEAT_TIMEOUT_MS
      )
      try {
        const snapshot = await heartbeatToolPresence(
          domainId,
          toolId,
          clientId,
          controller.signal
        )
        if (active && document.visibilityState === "visible") {
          setState({
            key,
            users: snapshot.users,
            available: true,
            tabLimitReached: false,
          })
        }
      } catch (error) {
        if (active && document.visibilityState === "visible") {
          setState({
            key,
            users: [],
            available: false,
            tabLimitReached:
              error instanceof ApiError && error.code === "PRESENCE_TAB_LIMIT",
          })
        }
      } finally {
        window.clearTimeout(timeoutId)
        if (heartbeatController === controller) heartbeatController = null
        heartbeatInFlight = false
      }
    }

    const leave = () => {
      void leaveToolPresence(domainId, toolId, clientId).catch(() => undefined)
    }
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        cancelPendingLeave(leaseKey)
        void heartbeat()
      } else {
        heartbeatController?.abort()
        scheduleLeave(leaseKey, leave)
        setState({ key, users: [], available: null, tabLimitReached: false })
      }
    }
    const onPageShow = () => {
      if (document.visibilityState === "visible") {
        cancelPendingLeave(leaseKey)
        void heartbeat()
      }
    }
    const onPageHide = (event: PageTransitionEvent) => {
      heartbeatController?.abort()
      if (event.persisted) scheduleLeave(leaseKey, leave)
      else leave()
    }
    const onOnline = () => {
      if (document.visibilityState === "visible") {
        cancelPendingLeave(leaseKey)
        void heartbeat()
      }
    }

    if (document.visibilityState === "visible") void heartbeat()
    const heartbeatTimer = window.setInterval(
      () => void heartbeat(),
      HEARTBEAT_INTERVAL_MS
    )
    document.addEventListener("visibilitychange", onVisibilityChange)
    window.addEventListener("focus", onVisibilityChange)
    window.addEventListener("pageshow", onPageShow)
    window.addEventListener("pagehide", onPageHide)
    window.addEventListener("online", onOnline)

    return () => {
      active = false
      heartbeatController?.abort()
      window.clearInterval(heartbeatTimer)
      document.removeEventListener("visibilitychange", onVisibilityChange)
      window.removeEventListener("focus", onVisibilityChange)
      window.removeEventListener("pageshow", onPageShow)
      window.removeEventListener("pagehide", onPageHide)
      window.removeEventListener("online", onOnline)
      scheduleLeave(leaseKey, leave)
    }
  }, [domainId, enabled, key, toolId, userId])

  const current = state.key === key
  return {
    users: current ? state.users : [],
    available: current ? state.available : null,
    tabLimitReached: current && state.tabLimitReached,
    loading: !current || state.available === null,
  }
}
