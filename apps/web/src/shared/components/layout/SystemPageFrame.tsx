import type { ReactNode } from "react"
import { Link } from "react-router-dom"
import { Moon, Sun } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import { useTheme } from "@/app/providers"
import { BrandMark } from "@/shared/components/layout/BrandMark"
import { branding } from "@/shared/config/orbit-config"

type SystemPageFrameProps = {
  children: ReactNode
  aside?: ReactNode
  headerLabel: string
  footerNote?: string
}

export function SystemPageFrame({
  children,
  aside,
  headerLabel,
  footerNote = `${branding.productName} · Managed by your workspace administrator`,
}: SystemPageFrameProps) {
  const { resolvedTheme, setTheme } = useTheme()
  const isDark = resolvedTheme === "dark"

  return (
    <main className="flex min-h-svh flex-col bg-background text-foreground">
      <header className="border-b border-border/70">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-5 py-4 sm:px-8">
          <Link
            to="/"
            className="flex items-center gap-3 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            aria-label={`${branding.productName} home`}
          >
            <BrandMark />
            <span className="leading-none">
              <span className="block text-[12px] font-semibold tracking-[.18em]">
                {branding.shortName.toUpperCase()}
              </span>
              <span className="mt-1 block text-[10px] tracking-[.12em] text-muted-foreground uppercase">
                Workspace
              </span>
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <span className="hidden rounded-md border bg-card px-2.5 py-1.5 text-[10px] font-medium tracking-[.1em] text-muted-foreground uppercase sm:inline-flex">
              {headerLabel}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label={
                isDark ? "Switch to light theme" : "Switch to dark theme"
              }
              title={isDark ? "Switch to light theme" : "Switch to dark theme"}
              onClick={() => setTheme(isDark ? "light" : "dark")}
            >
              {isDark ? (
                <Sun className="size-4" />
              ) : (
                <Moon className="size-4" />
              )}
            </Button>
          </div>
        </div>
      </header>

      <div
        className={`mx-auto grid w-full max-w-7xl flex-1 items-center gap-10 px-5 py-9 sm:px-8 sm:py-12 ${aside ? "lg:grid-cols-[minmax(0,1fr)_minmax(360px,420px)] lg:gap-16" : "max-w-2xl justify-items-center"}`}
      >
        {aside && (
          <aside
            className="hidden min-w-0 lg:block"
            aria-label={`About ${branding.productName}`}
          >
            {aside}
          </aside>
        )}
        <section
          className={`mx-auto w-full ${aside ? "max-w-md lg:justify-self-end" : "max-w-lg"}`}
        >
          {children}
        </section>
      </div>

      <footer className="border-t border-border/70">
        <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-2 px-5 py-3 text-[11px] text-muted-foreground sm:px-8">
          <span>{branding.productName.toUpperCase()}</span>
          <div className="flex flex-wrap items-center justify-end gap-x-3 gap-y-1 text-right">
            <span>{footerNote}</span>
            {branding.supportUrl && (
              <a
                href={branding.supportUrl}
                target={
                  branding.supportUrl.startsWith("https://")
                    ? "_blank"
                    : undefined
                }
                rel={
                  branding.supportUrl.startsWith("https://")
                    ? "noreferrer"
                    : undefined
                }
                className="font-medium text-primary underline-offset-4 hover:underline focus-visible:rounded-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
              >
                {branding.supportLabel}
              </a>
            )}
          </div>
        </div>
      </footer>
    </main>
  )
}
