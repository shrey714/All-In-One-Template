import { useState } from "react"
import { Orbit } from "lucide-react"
import { branding } from "@/shared/config/orbit-config"

export function BrandMark() {
  const [imageFailed, setImageFailed] = useState(false)

  return (
    <span className="grid size-9 shrink-0 place-items-center overflow-hidden rounded-lg border border-primary/20 bg-primary/10 text-primary">
      {branding.logoPath && !imageFailed ? (
        <img
          src={branding.logoPath}
          alt=""
          aria-hidden="true"
          className="size-full object-contain p-1"
          onError={() => setImageFailed(true)}
        />
      ) : (
        <Orbit className="size-[18px]" strokeWidth={2.2} aria-hidden="true" />
      )}
    </span>
  )
}
