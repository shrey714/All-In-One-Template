import { resolve } from "node:path"
import { readFileSync } from "node:fs"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

const orbitConfig = JSON.parse(
  readFileSync(resolve(import.meta.dirname, "../../orbit.config.json"), "utf8")
)

// https://vite.dev/config/
export default defineConfig({
  define: {
    __ORBIT_CONFIG__: JSON.stringify(orbitConfig),
  },
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": resolve(import.meta.dirname, "./src"),
    },
  },
  server: {
    proxy: {
      "/api": {
        target: "http://127.0.0.1:3001",
        changeOrigin: false,
      },
    },
  },
})
