import { createServer } from "node:http"
import { pathToFileURL } from "node:url"
import { openDatabase } from "./database.js"
import { createApp } from "./app.js"
import { loadOrbitConfig } from "./config.js"
import { startWebhookWorker } from "./webhooks.js"

export function startServer() {
  const config = loadOrbitConfig()
  const database = openDatabase()
  if (!config.auth.enabled) {
    database.prepare("DELETE FROM sessions").run()
    console.log("Authentication is disabled by orbit.config.json.")
  }
  const app = createApp(database, config)
  const stopWebhookWorker =
    config.webhooks.enabled && config.webhooks.subscriptions.length > 0
      ? startWebhookWorker(app.locals.orbitWebhooks)
      : async () => undefined
  const port = Number(process.env.ORBIT_API_PORT ?? 3001)
  const host = process.env.ORBIT_API_HOST ?? "127.0.0.1"
  const server = createServer(app)
  server.listen(port, host, () => {
    console.log(`Orbit API listening on http://${host}:${port}`)
    console.log(
      "SQLite user store:",
      process.env.ORBIT_DATA_DIR ?? "backend/data"
    )
    console.log("No public account registration route is enabled.")
  })
  let stopping = false
  const shutdown = () => {
    if (stopping) return
    stopping = true
    void stopWebhookWorker().finally(() => {
      server.close(() => {
        database.close()
        process.exit(0)
      })
    })
  }
  process.once("SIGINT", shutdown)
  process.once("SIGTERM", shutdown)
  return server
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  startServer()
}
