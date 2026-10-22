import { Droplets, Minus, Plus, RotateCcw } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { usePersistentState } from "@/shared/hooks/usePersistentState"

type Progress = { day: string; cups: number }
const storageKey = "orbit.workspace.health.hydration-tracker"
const today = () => new Date().toISOString().slice(0, 10)

export function HydrationTracker() {
  const [progress, setProgress] = usePersistentState<Progress>(storageKey, {
    day: today(),
    cups: 0,
  })
  const cups = progress.day === today() ? progress.cups : 0
  const goal = 8
  const setCups = (next: number) =>
    setProgress({ day: today(), cups: Math.max(0, Math.min(30, next)) })
  const percent = Math.min(100, Math.round((cups / goal) * 100))

  return (
    <Card className="mx-auto max-w-2xl overflow-hidden">
      <div className="bg-sky-500/10 px-6 py-7 text-center">
        <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-sky-500/15 text-sky-600">
          <Droplets className="size-6" />
        </span>
        <p className="mt-4 text-xs font-semibold tracking-widest text-sky-700 uppercase dark:text-sky-300">
          Daily hydration
        </p>
        <p className="mt-2 text-4xl font-semibold tabular-nums">
          {cups}
          <span className="text-lg text-muted-foreground"> / {goal} cups</span>
        </p>
        <div className="mx-auto mt-4 h-2 max-w-sm overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-sky-500 transition-[width]"
            style={{ width: `${percent}%` }}
          />
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          {percent}% of today's goal
        </p>
      </div>
      <CardHeader>
        <CardTitle>Track a glass</CardTitle>
        <CardDescription>
          Your count resets for a new day and is saved on this device.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap justify-center gap-2 pb-6">
        <Button
          variant="outline"
          aria-label="Remove one cup"
          onClick={() => setCups(cups - 1)}
          disabled={cups === 0}
        >
          <Minus />
          One less
        </Button>
        <Button onClick={() => setCups(cups + 1)} disabled={cups >= 30}>
          <Plus />
          Add a cup
        </Button>
        <Button variant="ghost" onClick={() => setCups(0)}>
          <RotateCcw />
          Reset today
        </Button>
      </CardContent>
    </Card>
  )
}
