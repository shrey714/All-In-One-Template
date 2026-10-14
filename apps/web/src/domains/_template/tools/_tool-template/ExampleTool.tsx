import type { ToolContext } from "@/shared/types/tool"
export function ExampleTool({ domainId, toolId }: ToolContext) { return <section aria-label={`${toolId} in ${domainId}`} className="rounded-xl border bg-card p-5"><h2 className="font-semibold">Example tool</h2><p className="mt-1 text-sm text-muted-foreground">Replace this starter with your tool UI.</p></section> }
