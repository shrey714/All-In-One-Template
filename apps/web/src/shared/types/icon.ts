import type { ComponentType } from "react"

export type IconComponent = ComponentType<{ className?: string }>

export type ImageIconSource = {
  type: "image"
  /** Root-relative file in apps/web/public or an absolute HTTPS URL. */
  src: string
  /** Optional vector icon to use if the image cannot be loaded. */
  fallback?: IconComponent
}

/** Supports existing Lucide components and custom local/remote image sources. */
export type IconSource = IconComponent | ImageIconSource

export function isImageIconSource(icon: IconSource): icon is ImageIconSource {
  return (
    typeof icon === "object" &&
    icon !== null &&
    "type" in icon &&
    icon.type === "image" &&
    "src" in icon
  )
}
