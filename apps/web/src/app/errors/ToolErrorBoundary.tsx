import { Component, type ErrorInfo, type ReactNode } from "react"
import { AlertTriangle, RotateCcw } from "lucide-react"
import { Link } from "react-router-dom"
import { Button } from "@workspace/ui/components/button"
import { Card, CardContent } from "@workspace/ui/components/card"

type Props = { toolName: string; children: ReactNode }
type State = { error: Error | null }

export class ToolErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(
      `Tool "${this.props.toolName}" crashed`,
      error,
      info.componentStack
    )
  }

  private retry = () => this.setState({ error: null })

  render() {
    if (!this.state.error) return this.props.children
    return (
      <div className="grid min-h-[min(62vh,640px)] place-items-center py-8">
        <Card className="w-full max-w-xl overflow-hidden border-destructive/25">
          <div className="h-1.5 bg-destructive" />
          <CardContent className="flex flex-col items-center px-6 py-10 text-center sm:px-10">
            <span className="grid size-14 place-items-center rounded-2xl border border-destructive/25 bg-destructive/10 text-destructive">
              <AlertTriangle className="size-6" aria-hidden="true" />
            </span>
            <p className="mt-4 text-xs font-semibold tracking-widest text-destructive uppercase">
              Tool error
            </p>
            <h2 className="mt-2 text-xl font-semibold tracking-tight">
              {this.props.toolName} stopped unexpectedly
            </h2>
            <p
              role="alert"
              className="mt-2 max-w-md text-sm leading-6 text-muted-foreground"
            >
              This tool encountered a problem. The rest of your workspace is
              still available.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              <Button onClick={this.retry}>
                <RotateCcw />
                Try again
              </Button>
              <Button variant="outline" asChild>
                <Link to="/">Return to workspace</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }
}
