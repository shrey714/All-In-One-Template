import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import "@workspace/ui/globals.css"
import { App } from "./App.tsx"
import { ThemeProvider } from "@/app/providers"

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider defaultTheme="system">
      <App />
    </ThemeProvider>
  </StrictMode>
)
