export type ApiRequestOptions = RequestInit & { baseUrl?: string }
export async function apiRequest<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const { baseUrl = import.meta.env.VITE_API_BASE_URL ?? "", headers, ...init } = options
  const response = await fetch(new URL(path, baseUrl || window.location.origin), { ...init, headers: { Accept: "application/json", ...headers } })
  if (!response.ok) throw new Error(`API request failed (${response.status} ${response.statusText})`)
  if (response.status === 204) return undefined as T
  return await response.json() as T
}
