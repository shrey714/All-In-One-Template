import { requestApi } from "@/shared/services/auth-api"

export interface ToolPresenceUser {
  displayName: string
  isYou: boolean
}

export interface ToolPresenceSnapshot {
  users: ToolPresenceUser[]
  count: number
  refreshedAt: string
}

function endpoint(domainId: string, toolId: string) {
  return `/api/presence/${encodeURIComponent(domainId)}/${encodeURIComponent(toolId)}`
}

export function listToolPresence(domainId: string, toolId: string) {
  return requestApi<ToolPresenceSnapshot>(endpoint(domainId, toolId))
}

export function heartbeatToolPresence(
  domainId: string,
  toolId: string,
  clientId: string,
  signal?: AbortSignal
) {
  return requestApi<ToolPresenceSnapshot>(
    `${endpoint(domainId, toolId)}/heartbeat`,
    {
      method: "POST",
      body: JSON.stringify({ clientId }),
      signal,
    }
  )
}

export function leaveToolPresence(
  domainId: string,
  toolId: string,
  clientId: string
) {
  return requestApi<void>(`${endpoint(domainId, toolId)}/heartbeat`, {
    method: "DELETE",
    body: JSON.stringify({ clientId }),
    keepalive: true,
  })
}
