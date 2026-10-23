import { Skeleton } from "@workspace/ui/components/skeleton"

export function DashboardLoadingSkeleton() {
  return (
    <div
      role="status"
      aria-label="Loading dashboard overview"
      aria-busy="true"
      className="space-y-8"
    >
      <span className="sr-only">Loading dashboard overview…</span>
      <div aria-hidden="true" className="space-y-3">
        <Skeleton className="h-3 w-36" />
        <Skeleton className="h-8 w-72 max-w-full" />
        <Skeleton className="h-4 w-[min(34rem,90%)]" />
        <Skeleton className="h-4 w-[min(27rem,75%)]" />
      </div>

      <div aria-hidden="true" className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {Array.from({ length: 3 }, (_, index) => (
          <div
            key={index}
            className="flex items-center gap-3 rounded-xl border bg-card px-4 py-4"
          >
            <Skeleton className="size-9 shrink-0 rounded-lg" />
            <div className="min-w-0 flex-1 space-y-2">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-5 w-10" />
            </div>
          </div>
        ))}
      </div>

      <section aria-hidden="true" className="space-y-3">
        <div className="flex items-end justify-between">
          <div className="space-y-2">
            <Skeleton className="h-2.5 w-20" />
            <Skeleton className="h-5 w-32" />
          </div>
          <Skeleton className="h-5 w-16 rounded-md" />
        </div>
        <div className="flex items-center gap-3 rounded-xl border border-dashed bg-muted/20 px-4 py-4">
          <Skeleton className="size-10 shrink-0 rounded-lg" />
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-4 w-44 max-w-full" />
            <Skeleton className="h-3 w-[min(30rem,90%)]" />
          </div>
        </div>
      </section>

      <section aria-hidden="true" className="space-y-3">
        <div className="space-y-2">
          <Skeleton className="h-2.5 w-16" />
          <Skeleton className="h-6 w-44" />
        </div>
        <div className="grid gap-4 xl:grid-cols-2">
          {Array.from({ length: 5 }, (_, index) => (
            <div
              key={index}
              className="overflow-hidden rounded-xl border bg-card"
            >
              <div className="flex items-center gap-3 border-b px-4 py-4">
                <Skeleton className="size-9 shrink-0 rounded-lg" />
                <div className="min-w-0 flex-1 space-y-2">
                  <Skeleton className="h-4 w-32 max-w-full" />
                  <Skeleton className="h-3 w-48 max-w-full" />
                </div>
                <Skeleton className="h-6 w-14 shrink-0 rounded-md" />
              </div>
              <div className="divide-y divide-border/70">
                {Array.from({ length: index % 2 === 0 ? 2 : 3 }, (_, row) => (
                  <div key={row} className="flex items-center gap-3 px-4 py-3">
                    <Skeleton className="size-8 shrink-0 rounded-lg" />
                    <div className="min-w-0 flex-1 space-y-2">
                      <Skeleton className="h-3.5 w-36 max-w-full" />
                      <Skeleton className="h-3 w-52 max-w-full" />
                    </div>
                    <Skeleton className="size-4 shrink-0 rounded-full" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

export function ToolContentLoadingSkeleton({ toolName }: { toolName: string }) {
  return (
    <div
      role="status"
      aria-label={`Loading ${toolName}`}
      aria-busy="true"
      className="space-y-5"
    >
      <span className="sr-only">Loading {toolName}…</span>
      <div aria-hidden="true" className="grid gap-4 xl:grid-cols-2">
        <section className="space-y-5 rounded-xl border bg-card p-5">
          <div className="space-y-2">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-3.5 w-64 max-w-full" />
          </div>
          {Array.from({ length: 3 }, (_, index) => (
            <div key={index} className="space-y-2">
              <Skeleton className="h-3 w-28" />
              <Skeleton className="h-10 w-full rounded-lg" />
            </div>
          ))}
          <div className="flex gap-2 pt-1">
            <Skeleton className="h-9 w-28 rounded-md" />
            <Skeleton className="h-9 w-24 rounded-md" />
          </div>
        </section>

        <div className="space-y-4">
          <section className="space-y-4 rounded-xl border bg-card p-5">
            <div className="space-y-2">
              <Skeleton className="h-5 w-36" />
              <Skeleton className="h-3.5 w-52 max-w-full" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              {Array.from({ length: 4 }, (_, index) => (
                <div key={index} className="space-y-2 rounded-lg border p-3">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-6 w-28 max-w-full" />
                </div>
              ))}
            </div>
          </section>
          <section className="space-y-3 rounded-xl border bg-card p-5">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-28 w-full rounded-lg" />
            <div className="flex justify-between gap-3">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-3 w-28" />
            </div>
          </section>
        </div>
      </div>

      <section
        aria-hidden="true"
        className="space-y-4 rounded-xl border bg-card p-5"
      >
        <div className="flex items-center justify-between gap-3">
          <Skeleton className="h-5 w-44" />
          <Skeleton className="h-8 w-24 rounded-md" />
        </div>
        <div className="space-y-3">
          {Array.from({ length: 3 }, (_, index) => (
            <div key={index} className="grid grid-cols-4 gap-3">
              {Array.from({ length: 4 }, (_, cell) => (
                <Skeleton key={cell} className="h-3 w-full" />
              ))}
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
