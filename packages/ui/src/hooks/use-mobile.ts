import * as React from "react"

const MOBILE_BREAKPOINT = 768
const MOBILE_QUERY = `(max-width: ${MOBILE_BREAKPOINT - 1}px)`

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState(() => window.matchMedia(MOBILE_QUERY).matches)

  React.useEffect(() => {
    const media = window.matchMedia(MOBILE_QUERY)
    const onChange = (event: MediaQueryListEvent) => setIsMobile(event.matches)
    media.addEventListener("change", onChange)
    return () => media.removeEventListener("change", onChange)
  }, [])

  return isMobile
}
