import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import { fileURLToPath } from "node:url"

export type OrbitRuntimeConfig = {
  auth: {
    enabled: boolean
    inactivityTimeoutMinutes: number
    warningBeforeTimeoutSeconds: number
  }
  notifications: { enabled: boolean }
}

const configPath = process.env.ORBIT_CONFIG_PATH
  ? resolve(process.env.ORBIT_CONFIG_PATH)
  : fileURLToPath(new URL("../../orbit.config.json", import.meta.url))

const defaults: OrbitRuntimeConfig = {
  auth: {
    enabled: true,
    inactivityTimeoutMinutes: 30,
    warningBeforeTimeoutSeconds: 60,
  },
  notifications: { enabled: true },
}

export function loadOrbitConfig(): OrbitRuntimeConfig {
  let parsed: unknown
  try {
    parsed = JSON.parse(readFileSync(configPath, "utf8"))
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return defaults
    throw new Error(`Could not read Orbit config at ${configPath}.`, {
      cause: error,
    })
  }
  if (!parsed || typeof parsed !== "object" || !("auth" in parsed)) {
    throw new Error(`Orbit config at ${configPath} must define an auth object.`)
  }
  const auth = (parsed as { auth: unknown }).auth
  if (!auth || typeof auth !== "object") {
    throw new Error(`Orbit config at ${configPath} must define an auth object.`)
  }
  const candidate = auth as Record<string, unknown>
  const enabled = candidate.enabled ?? defaults.auth.enabled
  const inactivityTimeoutMinutes =
    candidate.inactivityTimeoutMinutes ?? defaults.auth.inactivityTimeoutMinutes
  const warningBeforeTimeoutSeconds =
    candidate.warningBeforeTimeoutSeconds ??
    defaults.auth.warningBeforeTimeoutSeconds
  if (typeof enabled !== "boolean") {
    throw new Error("auth.enabled must be true or false.")
  }
  if (
    typeof inactivityTimeoutMinutes !== "number" ||
    !Number.isInteger(inactivityTimeoutMinutes) ||
    inactivityTimeoutMinutes < 0 ||
    inactivityTimeoutMinutes > 1440
  ) {
    throw new Error(
      "auth.inactivityTimeoutMinutes must be an integer from 0 to 1440 (0 disables idle expiry)."
    )
  }
  if (
    typeof warningBeforeTimeoutSeconds !== "number" ||
    !Number.isInteger(warningBeforeTimeoutSeconds) ||
    warningBeforeTimeoutSeconds < 10 ||
    warningBeforeTimeoutSeconds > 300
  ) {
    throw new Error(
      "auth.warningBeforeTimeoutSeconds must be an integer from 10 to 300."
    )
  }
  const rawNotifications = (parsed as Record<string, unknown>).notifications
  if (
    rawNotifications !== undefined &&
    (typeof rawNotifications !== "object" ||
      rawNotifications === null ||
      Array.isArray(rawNotifications))
  ) {
    throw new Error("notifications must be an object.")
  }
  const notificationsEnabled =
    (rawNotifications as Record<string, unknown> | undefined)?.enabled ??
    defaults.notifications.enabled
  if (typeof notificationsEnabled !== "boolean") {
    throw new Error("notifications.enabled must be true or false.")
  }
  return {
    auth: { enabled, inactivityTimeoutMinutes, warningBeforeTimeoutSeconds },
    notifications: { enabled: notificationsEnabled },
  }
}
