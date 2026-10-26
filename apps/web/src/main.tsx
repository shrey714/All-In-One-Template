import { lazy, StrictMode, Suspense } from "react"
import { createRoot } from "react-dom/client"
import "@workspace/ui/globals.css"
import "sileo/styles.css"
import { App } from "./App.tsx"
import { ThemeProvider } from "@/app/providers"

const OrbitToaster = lazy(() =>
  import("@/shared/components/layout/OrbitToaster").then((module) => ({
    default: module.OrbitToaster,
  }))
)

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider defaultTheme="system">
      <Suspense fallback={null}>
        <OrbitToaster />
      </Suspense>
      <App />
    </ThemeProvider>
  </StrictMode>
)
