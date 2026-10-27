import { createInterface } from "node:readline/promises"
import { stdin, stdout } from "node:process"
import { hashPassword, isValidPasswordLength } from "./password.js"
import {
  activeAdminCount,
  establishSystemAdmin,
  openDatabase,
} from "./database.js"

async function readMasked(prompt: string) {
  if (!stdin.isTTY || typeof stdin.setRawMode !== "function") {
    throw new Error(
      "Run this command in an interactive terminal so the password is not echoed or recorded in shell history."
    )
  }
  stdout.write(prompt)
  stdin.setRawMode(true)
  stdin.resume()
  stdin.setEncoding("utf8")
  return new Promise<string>((resolve, reject) => {
    let value = ""
    const onData = (chunk: string) => {
      for (const char of chunk) {
        if (char === "\u0003") {
          cleanup()
          reject(new Error("Admin setup cancelled."))
          return
        }
        if (char === "\r" || char === "\n") {
          cleanup()
          stdout.write("\n")
          resolve(value)
          return
        }
        if (char === "\u007f" || char === "\b") {
          value = value.slice(0, -1)
          continue
        }
        if (char >= " ") value += char
      }
    }
    const cleanup = () => {
      stdin.off("data", onData)
      stdin.setRawMode(false)
      stdin.pause()
    }
    stdin.on("data", onData)
  })
}

async function main() {
  const database = openDatabase()
  try {
    if (activeAdminCount(database) > 0) {
      throw new Error(
        "An active Admin already exists. Use the Admin Users screen to provision accounts."
      )
    }
    const prompt = createInterface({ input: stdin, output: stdout })
    const usernameInput = await prompt.question(
      "Initial Admin username (3–40 characters): "
    )
    prompt.close()
    const username = usernameInput.trim().toLowerCase()
    if (!/^[a-z0-9._-]{3,40}$/.test(username)) {
      throw new Error(
        "Username must use 3–40 letters, numbers, dots, dashes, or underscores."
      )
    }
    const password = await readMasked(
      "Initial Admin password (12–128 characters): "
    )
    const confirmation = await readMasked("Confirm password: ")
    if (!isValidPasswordLength(password))
      throw new Error("Password must be between 12 and 128 characters.")
    if (password !== confirmation) throw new Error("Passwords do not match.")
    const passwordHash = await hashPassword(password)
    const now = new Date().toISOString()
    const result = database
      .prepare(
        "INSERT INTO users (username, display_name, password_hash, role, is_active, must_change_password, created_at, updated_at) VALUES (?, ?, ?, 'admin', 1, 0, ?, ?)"
      )
      .run(username, username, passwordHash, now, now)
    establishSystemAdmin(database, Number(result.lastInsertRowid))
    console.log(
      `Initial System administrator '${username}' created. Sign in at /login.`
    )
  } finally {
    database.close()
  }
}

main().catch((error: unknown) => {
  console.error(
    error instanceof Error ? error.message : "Initial Admin setup failed."
  )
  process.exitCode = 1
})
