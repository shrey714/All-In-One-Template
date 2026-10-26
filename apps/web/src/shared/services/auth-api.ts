export class ApiError extends Error {
  readonly status: number

  constructor(message: string, status: number) {
    super(message)
    this.status = status
    this.name = "ApiError"
  }
}

export async function requestApi<T>(
  path: string,
  init: RequestInit = {}
): Promise<T> {
  const headers = new Headers(init.headers)
  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json")
  }
  headers.set("Accept", "application/json")

  let response: Response
  try {
    response = await fetch(path, {
      ...init,
      headers,
      credentials: "same-origin",
      cache: "no-store",
    })
  } catch {
    throw new ApiError(
      "Orbit's authentication backend is not reachable. Start the backend and try again.",
      0
    )
  }

  if (response.status === 204) return undefined as T
  const payload = (await response.json().catch(() => null)) as {
    error?: unknown
  } | null
  if (!response.ok) {
    const message =
      payload && typeof payload.error === "string"
        ? payload.error
        : "The request could not be completed."
    throw new ApiError(message, response.status)
  }
  return payload as T
}
