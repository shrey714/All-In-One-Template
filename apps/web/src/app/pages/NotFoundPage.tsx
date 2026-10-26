import { Link } from "react-router-dom"
import { ArrowLeft, Compass, Home } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import { branding } from "@/shared/config/orbit-config"

export function NotFoundPage() {
  return (
    <div className="mx-auto flex min-h-[55vh] max-w-2xl items-center justify-center px-5 py-12">
      <section className="w-full rounded-xl border bg-card p-7 shadow-sm sm:p-9">
        <div className="flex items-center justify-between gap-4">
          <span className="text-[10px] font-semibold tracking-[.16em] text-muted-foreground uppercase">
            {branding.shortName} / Route lookup
          </span>
          <span className="font-mono text-xs text-muted-foreground">404</span>
        </div>
        <div className="mt-8 flex items-start gap-4">
          <span className="grid size-11 shrink-0 place-items-center rounded-lg border bg-muted/60 text-primary">
            <Compass className="size-5" />
          </span>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              This destination isn’t in your workspace
            </h1>
            <p className="mt-2 max-w-lg text-sm leading-6 text-muted-foreground">
              The link may be outdated, or this domain or tool may have moved.
              You can return to your workspace and continue from the Explorer.
            </p>
          </div>
        </div>
        <div className="mt-8 flex flex-wrap gap-2">
          <Button asChild>
            <Link to="/">
              <Home className="size-4" /> Go to workspace
            </Link>
          </Button>
          <Button variant="outline" onClick={() => window.history.back()}>
            <ArrowLeft className="size-4" /> Go back
          </Button>
        </div>
      </section>
    </div>
  )
}
