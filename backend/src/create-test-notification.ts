import { loadOrbitConfig } from "./config.js"
import { openDatabase } from "./database.js"
import { createPersistentNotification } from "./notifications-store.js"

function main() {
  if (process.env.NODE_ENV === "production") {
    throw new Error("The test notification command is disabled in production.")
  }

  const username = process.argv[2]?.trim()
  if (!username) {
    throw new Error(
      "Usage: npm run notification:test -- <existing-local-username>"
    )
  }

  const config = loadOrbitConfig()
  if (!config.auth.enabled) {
    throw new Error("Enable auth to preview the account-scoped Inbox.")
  }
  if (!config.notifications.enabled) {
    throw new Error("Set notifications.enabled to true in orbit.config.json.")
  }

  const database = openDatabase()
  try {
    const user = database
      .prepare(
        "SELECT id FROM users WHERE username = ? COLLATE NOCASE AND is_active = 1"
      )
      .get(username) as { id: number } | undefined
    if (!user) {
      throw new Error(`No active account found for username '${username}'.`)
    }

    const notification = createPersistentNotification(database, {
      recipientUserId: user.id,
      title: `Orbit Inbox test · ${new Date().toLocaleString()}`,
      body: "This sample confirms the persistent Inbox, unread badge, priority filter, and in-app deep link are working.",
      priority: true,
      href: "/domains/finance/tools/emi-calculator",
      sourceDomainId: "finance",
      sourceToolId: "emi-calculator",
    })
    console.log(
      `Created priority notification ${notification.id} for ${username}. Open Orbit → Activity Rail → Inbox.`
    )
  } finally {
    database.close()
  }
}

try {
  main()
} catch (error) {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
}
