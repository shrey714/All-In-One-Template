import { useState } from "react"
import { Image } from "lucide-react"
import { isImageIconSource, type IconSource } from "@/shared/types/icon"

type Props = {
  icon: IconSource
  className?: string
}

function isAllowedImageSource(src: string) {
  if (!src || src.includes("\\") || src.startsWith("//")) {
    return false
  }
  for (let index = 0; index < src.length; index += 1) {
    const code = src.charCodeAt(index)
    if (code < 32 || code === 127) return false
  }
  if (src.startsWith("/")) {
    if (src.startsWith("//")) return false
    try {
      return src
        .slice(1)
        .split("/")
        .every((part) => {
          const decoded = decodeURIComponent(part)
          return (
            Boolean(decoded) &&
            decoded !== "." &&
            decoded !== ".." &&
            !/[\\/?#]/.test(decoded) &&
            !Array.from(decoded).some((character) => {
              const code = character.charCodeAt(0)
              return code < 32 || code === 127
            })
          )
        })
    } catch {
      return false
    }
  }

  try {
    const url = new URL(src)
    return url.protocol === "https:" && !url.username && !url.password
  } catch {
    return false
  }
}

/** Render a Lucide component or a safe, decorative image icon. */
export function AppIcon({ icon, className }: Props) {
  const [failedSource, setFailedSource] = useState<string | null>(null)

  if (!isImageIconSource(icon)) {
    const Icon = icon
    return <Icon className={className} />
  }

  const allowed = isAllowedImageSource(icon.src)
  if (!allowed || failedSource === icon.src) {
    const Fallback = icon.fallback ?? Image
    return <Fallback className={className} />
  }

  return (
    <img
      aria-hidden="true"
      alt=""
      className={`${className ?? ""} scale-[1.75] object-contain`}
      decoding="async"
      draggable={false}
      referrerPolicy="no-referrer"
      src={icon.src}
      onError={() => setFailedSource(icon.src)}
    />
  )
}
