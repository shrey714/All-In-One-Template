import { Construction } from "lucide-react"
import { Card, CardContent } from "@workspace/ui/components/card"

export function ApiRequestBuilder() {
  return (
    <Card>
      <CardContent className="flex min-h-48 flex-col items-center justify-center p-8 text-center">
        <Construction className="size-8 text-muted-foreground" />
        <h2 className="mt-3 font-semibold">API request builder</h2>
        <p className="mt-1 max-w-md text-sm text-muted-foreground">
          This tool is not available yet. Its availability is configured in the
          central tool registry.
        </p>
      </CardContent>
    </Card>
  )
}
