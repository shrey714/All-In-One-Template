import { useMemo, useState } from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { Label } from "@workspace/ui/components/label"

export function WordCounter() {
  const [text, setText] = useState("")
  const stats = useMemo(() => {
    const words = text.trim() ? text.trim().split(/\s+/u).length : 0
    const paragraphs = text.trim() ? text.trim().split(/\n\s*\n/u).length : 0
    return {
      words,
      characters: text.length,
      noSpaces: text.replace(/\s/gu, "").length,
      paragraphs,
      minutes: Math.ceil(words / 200),
    }
  }, [text])

  return (
    <div className="mx-auto grid max-w-5xl gap-4 lg:grid-cols-[1fr_260px]">
      <Card>
        <CardHeader>
          <CardTitle>Word counter</CardTitle>
          <CardDescription>
            Live writing metrics. Your text stays in this page.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Label htmlFor="word-counter-text" className="sr-only">
            Text to count
          </Label>
          <textarea
            id="word-counter-text"
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder="Start writing or paste text here…"
            className="min-h-80 w-full resize-y rounded-xl border bg-background p-4 text-sm leading-6 outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Writing stats</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-3 lg:grid-cols-1">
          {[
            ["Words", stats.words],
            ["Characters", stats.characters],
            ["No spaces", stats.noSpaces],
            ["Paragraphs", stats.paragraphs],
            ["Reading time", `${stats.minutes} min`],
          ].map(([label, value]) => (
            <div
              key={String(label)}
              className="rounded-lg border bg-muted/20 p-3"
            >
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className="mt-1 text-lg font-semibold tabular-nums">{value}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
