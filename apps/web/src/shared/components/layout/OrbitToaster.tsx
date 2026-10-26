import { Toaster } from "sileo"
import { useTheme } from "@/app/providers"

export function OrbitToaster() {
  const { theme } = useTheme()

  return (
    <Toaster
      position="bottom-right"
      theme={theme}
      offset={{ bottom: 30 }}
      options={{
        duration: 4000,
        fill: "var(--toast-surface)",
        styles: { description: "!text-muted-foreground" },
      }}
    />
  )
}
