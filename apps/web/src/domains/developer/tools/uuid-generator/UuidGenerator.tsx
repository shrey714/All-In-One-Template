import { useState } from "react"
import { Clipboard, Copy, Dices, RefreshCw } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"

function createUuid() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID()
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (char) => {
    const value = Math.floor(Math.random() * 16)
    return (char === "x" ? value : (value & 0x3) | 0x8).toString(16)
  })
}

export function UuidGenerator() {
  const [uuids, setUuids] = useState(() => [createUuid()])
  const generate = (count = 1) =>
    setUuids(Array.from({ length: count }, createUuid))
  const copy = async (value: string) => navigator.clipboard.writeText(value)

  return (
    <Card className="mx-auto max-w-3xl">
      <CardHeader>
        <CardTitle>UUID generator</CardTitle>
        <CardDescription>
          Create version 4 identifiers locally in your browser.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => generate()}>
            <Dices />
            Generate UUID
          </Button>
          <Button variant="outline" onClick={() => generate(5)}>
            <RefreshCw />
            Generate 5
          </Button>
        </div>
        <div className="space-y-2" aria-live="polite">
          {uuids.map((uuid) => (
            <div
              key={uuid}
              className="flex min-w-0 items-center gap-2 rounded-lg border bg-muted/30 p-3"
            >
              <code className="min-w-0 flex-1 font-mono text-sm break-all">
                {uuid}
              </code>
              <Button
                size="icon-sm"
                variant="ghost"
                aria-label={`Copy ${uuid}`}
                onClick={() => copy(uuid)}
              >
                <Copy />
              </Button>
            </div>
          ))}
        </div>
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Clipboard className="size-3.5" />
          Identifiers are generated on this device and are not sent anywhere.
        </p>
      </CardContent>
    </Card>
  )
}
