import { useState } from "react"
import { ArrowDownUp, Copy, Link2 } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { Label } from "@workspace/ui/components/label"

export function UrlEncoder() {
  const [input, setInput] = useState(
    "https://example.com/search?q=hello world&tag=tools"
  )
  const [mode, setMode] = useState<"encode" | "decode">("encode")
  const [error, setError] = useState("")
  let output = ""
  if (!error) {
    try {
      output =
        mode === "encode"
          ? encodeURIComponent(input)
          : decodeURIComponent(input)
    } catch {
      output = ""
    }
  }
  const transform = (nextMode: "encode" | "decode") => {
    setMode(nextMode)
    setError("")
    if (nextMode === "decode") {
      try {
        decodeURIComponent(input)
      } catch {
        setError("Input contains an invalid percent-encoded sequence.")
      }
    }
  }
  const swap = () => {
    setInput(output)
    setMode(mode === "encode" ? "decode" : "encode")
    setError("")
  }

  return (
    <Card className="mx-auto max-w-3xl">
      <CardHeader>
        <CardTitle>URL encoder / decoder</CardTitle>
        <CardDescription>
          Encode or decode URL components locally in your browser.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <Button
            variant={mode === "encode" ? "default" : "outline"}
            onClick={() => transform("encode")}
          >
            Encode
          </Button>
          <Button
            variant={mode === "decode" ? "default" : "outline"}
            onClick={() => transform("decode")}
          >
            Decode
          </Button>
        </div>
        <div className="space-y-2">
          <Label htmlFor="url-input">Input</Label>
          <textarea
            id="url-input"
            value={input}
            onChange={(event) => {
              setInput(event.target.value)
              setError("")
            }}
            className="min-h-32 w-full resize-y rounded-lg border bg-background p-3 font-mono text-xs leading-5 outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
        {error && (
          <p role="alert" className="text-xs text-destructive">
            {error}
          </p>
        )}
        <div className="flex items-center justify-between gap-2">
          <Label htmlFor="url-output">
            {mode === "encode" ? "Encoded" : "Decoded"} result
          </Label>
          <Button variant="ghost" size="sm" onClick={swap}>
            <ArrowDownUp />
            Swap
          </Button>
        </div>
        <pre
          id="url-output"
          className="min-h-20 overflow-auto rounded-lg border bg-muted/30 p-3 font-mono text-xs leading-5 break-all whitespace-pre-wrap"
        >
          {output}
        </pre>
        <Button
          variant="outline"
          onClick={() => navigator.clipboard.writeText(output)}
          disabled={Boolean(error)}
        >
          <Copy />
          Copy result
        </Button>
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Link2 className="size-3.5" />
          Use this for URL components, not whole URLs.
        </p>
      </CardContent>
    </Card>
  )
}
