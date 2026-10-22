import { useState } from "react"
import { Check, Clipboard, Braces, Minimize2, Sparkles } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { Label } from "@workspace/ui/components/label"

const sample = '{"name":"Orbit","tools":["json","uuid"],"ready":true}'

export function JsonFormatter() {
  const [source, setSource] = useState(sample)
  const [result, setResult] = useState(sample)
  const [error, setError] = useState("")

  const transform = (compact: boolean) => {
    try {
      const parsed: unknown = JSON.parse(source)
      setResult(JSON.stringify(parsed, null, compact ? undefined : 2))
      setError("")
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Invalid JSON input.")
    }
  }

  const copy = async () => {
    await navigator.clipboard.writeText(result)
  }

  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Input JSON</CardTitle>
          <CardDescription>
            Paste JSON to validate and transform it locally.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <Label htmlFor="json-input">JSON source</Label>
          <textarea
            id="json-input"
            value={source}
            onChange={(event) => setSource(event.target.value)}
            spellCheck={false}
            className="min-h-72 w-full resize-y rounded-xl border bg-background p-3 font-mono text-xs leading-5 outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          {error && (
            <p role="alert" className="text-xs text-destructive">
              {error}
            </p>
          )}
          <div className="flex flex-wrap gap-2 pt-1">
            <Button onClick={() => transform(false)}>
              <Sparkles />
              Format
            </Button>
            <Button variant="outline" onClick={() => transform(true)}>
              <Minimize2 />
              Minify
            </Button>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Result</CardTitle>
          <CardDescription>Formatted output is ready to copy.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="min-h-72 overflow-auto rounded-xl border bg-muted/30 p-3">
            <pre className="font-mono text-xs leading-5 break-all whitespace-pre-wrap">
              {result}
            </pre>
          </div>
          <Button variant="outline" onClick={copy}>
            <Clipboard />
            Copy result
          </Button>
          {!error && (
            <span className="ml-2 inline-flex items-center gap-1 text-xs text-emerald-600">
              <Check className="size-3.5" />
              Valid JSON
            </span>
          )}
          <span className="sr-only">
            <Braces />
          </span>
        </CardContent>
      </Card>
    </div>
  )
}
