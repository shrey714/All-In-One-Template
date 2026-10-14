import { useEffect, useState } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { Pause, Play, RotateCcw, SkipForward } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import { Card, CardContent } from "@workspace/ui/components/card"
import type { ToolContext } from "@/shared/types/tool"
import { timerConfig } from "@/domains/productivity/tools/pomodoro-timer/config/timer-config"
import { formatTimer } from "@/domains/productivity/tools/pomodoro-timer/utils/format-timer"

export function PomodoroTimer({ stepId }: ToolContext) {
  const [params, setParams] = useSearchParams()
  const navigate = useNavigate()
  const step = Math.max(1, Number(stepId ?? params.get("step")) || 1)
  const secondsParam = params.get("seconds")
  const seconds = Math.max(0, secondsParam === null ? timerConfig.focusSeconds : Number(secondsParam))
  const [running, setRunning] = useState(false)

  useEffect(() => {
    if (!running) return
    const timer = window.setInterval(() => {
      const next = new URLSearchParams(window.location.search)
      const remaining = Math.max(0, Number(next.get("seconds") ?? timerConfig.focusSeconds) - 1)
      next.set("seconds", String(remaining))
      next.set("step", String(step))
      setParams(next, { replace: true })
      if (remaining === 0) setRunning(false)
    }, 1000)
    return () => window.clearInterval(timer)
  }, [running, setParams, step])

  const reset = () => {
    setRunning(false)
    setParams({ step: String(step), seconds: String(timerConfig.focusSeconds) }, { replace: true })
  }
  const nextSession = () => {
    setRunning(false)
    const next = step + 1
    navigate(`/domains/productivity/tools/pomodoro-timer/steps/${next}?seconds=${timerConfig.focusSeconds}`)
  }

  return <Card className="mx-auto max-w-2xl text-center"><CardContent className="px-6 py-10 md:py-14"><p className="text-xs font-bold uppercase tracking-[.2em] text-primary">Focus session · Step {step}</p><div role="timer" aria-live="off" className="my-8 font-mono text-7xl font-semibold tracking-tight md:text-8xl">{formatTimer(seconds)}</div><p className="mx-auto mb-8 max-w-sm text-sm text-muted-foreground">Choose one task and give it your full attention until the timer ends.</p><div className="flex flex-wrap justify-center gap-2"><Button onClick={() => setRunning(value => !value)}>{running ? <><Pause/>Pause</> : <><Play/>Start focus</>}</Button><Button variant="outline" onClick={reset}><RotateCcw/>Reset</Button><Button variant="ghost" onClick={nextSession}>Next session <SkipForward/></Button></div><div className="mt-8 flex justify-center gap-2">{[1,2,3,4].map(number => <span key={number} aria-label={`Session ${number}${number === step ? ", current" : ""}`} className={`h-2 w-8 rounded-full ${number <= step ? "bg-primary" : "bg-muted"}`}/>)}</div></CardContent></Card>
}
