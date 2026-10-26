import { useEffect, useState } from "react"
import { Info } from "lucide-react"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@workspace/ui/components/sheet"
import { ToolAvailabilityBadge } from "@/shared/components/tools/ToolAvailability"
import { getDomain } from "@/shared/config/registry"
import type { ToolDefinition } from "@/shared/types/tool"

type ToolInfoSelection = ToolDefinition & {
  domainId: string
  domainName: string
}

const htmlInfoFiles = import.meta.glob("/src/domains/**/info.html", {
  query: "?raw",
  import: "default",
}) as Record<string, () => Promise<string>>

export function ToolInfoSheet({
  tool,
  onClose,
}: {
  tool: ToolInfoSelection | null
  onClose: () => void
}) {
  const domain = tool ? getDomain(tool.domainId) : undefined
  const [dark, setDark] = useState(
    () =>
      typeof document !== "undefined" &&
      document.documentElement.classList.contains("dark")
  )

  useEffect(() => {
    const root = document.documentElement
    const observer = new MutationObserver(() =>
      setDark(root.classList.contains("dark"))
    )
    observer.observe(root, { attributes: true, attributeFilter: ["class"] })
    return () => observer.disconnect()
  }, [])

  return (
    <Sheet
      open={Boolean(tool && domain)}
      onOpenChange={(open) => !open && onClose()}
    >
      <SheetContent
        side="right"
        className="w-[min(92vw,560px)] max-w-none gap-0 p-0 sm:max-w-none"
      >
        {tool && domain && (
          <>
            <SheetHeader className="shrink-0 border-b px-5 py-4 pr-12">
              <div className="mb-1 flex items-center gap-1.5 text-[10px] font-semibold tracking-[.12em] text-muted-foreground uppercase">
                <Info className="size-3.5" /> {domain.name} / {tool.category}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <SheetTitle>{tool.name}</SheetTitle>
                <ToolAvailabilityBadge availability={tool.availability} />
              </div>
              <SheetDescription>{tool.description}</SheetDescription>
            </SheetHeader>
            <div className="min-h-0 flex-1 p-0">
              <InfoHtmlDocument
                key={`${domain.id}:${tool.id}:${dark ? "dark" : "light"}`}
                domainId={domain.id}
                domainName={domain.name}
                toolId={tool.id}
                toolName={tool.name}
                dark={dark}
              />
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}

function InfoHtmlDocument({
  domainId,
  domainName,
  toolId,
  toolName,
  dark,
}: {
  domainId: string
  domainName: string
  toolId: string
  toolName: string
  dark: boolean
}) {
  const [srcDoc, setSrcDoc] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    const domainPath = `/src/domains/${domainId}/info.html`
    const toolPath = `/src/domains/${domainId}/tools/${toolId}/info.html`
    const load = (path: string) => {
      const importer = htmlInfoFiles[path]
      return importer ? importer() : Promise.resolve("")
    }

    void Promise.all([load(domainPath), load(toolPath)]).then(
      ([domainHtml, toolHtml]) => {
        if (!active) return
        setSrcDoc(
          buildInfoDocument({
            domainName,
            toolName,
            domainHtml,
            toolHtml,
            dark,
          })
        )
      }
    )
    return () => {
      active = false
    }
  }, [dark, domainId, domainName, toolId, toolName])

  if (!srcDoc) {
    return (
      <div
        role="status"
        className="grid h-full min-h-48 place-items-center p-6 text-sm text-muted-foreground"
      >
        Loading information…
      </div>
    )
  }

  return (
    <iframe
      title={`${domainName} and ${toolName} information`}
      sandbox=""
      srcDoc={srcDoc}
      className="h-full min-h-0 w-full flex-1 border-0 bg-transparent"
    />
  )
}

function buildInfoDocument({
  domainName,
  toolName,
  domainHtml,
  toolHtml,
  dark,
}: {
  domainName: string
  toolName: string
  domainHtml: string
  toolHtml: string
  dark: boolean
}) {
  const fallback = `<p>More information for this section has not been added yet.</p>`
  const colors = dark
    ? {
        background: "#09090b",
        foreground: "#f4f4f5",
        muted: "#a1a1aa",
        border: "#27272a",
        accent: "#a1a1aa",
      }
    : {
        background: "#ffffff",
        foreground: "#18181b",
        muted: "#71717a",
        border: "#e4e4e7",
        accent: "#52525b",
      }

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; img-src data:; font-src 'none'; connect-src 'none'; frame-src 'none'; form-action 'none'; base-uri 'none'">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    :root { color-scheme: ${dark ? "dark" : "light"}; }
    * { box-sizing: border-box; }
    body { margin: 0; padding: 20px; background: ${colors.background}; color: ${colors.foreground}; font: 13px/1.65 ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
    section + section { margin-top: 24px; padding-top: 22px; border-top: 1px solid ${colors.border}; }
    .eyebrow { margin: 0 0 8px; color: ${colors.accent}; font-size: 10px; font-weight: 700; letter-spacing: .12em; text-transform: uppercase; }
    h2 { margin: 0 0 12px; font-size: 18px; line-height: 1.35; letter-spacing: -.02em; }
    h3 { margin: 18px 0 6px; font-size: 13px; line-height: 1.4; }
    p { margin: 0 0 10px; color: ${colors.muted}; }
    ul { margin: 10px 0 0; padding-left: 19px; color: ${colors.muted}; }
    li { margin: 4px 0; padding-left: 2px; }
    li::marker { color: ${colors.accent}; }
    code { border-radius: 4px; background: ${colors.border}; padding: 1px 4px; color: ${colors.foreground}; }
    a { color: inherit; text-decoration: underline; text-underline-offset: 3px; }
  </style>
</head>
<body>
  <section>
    <p class="eyebrow">Domain</p>
    <h2>${escapeHtml(domainName)}</h2>
    ${domainHtml || fallback}
  </section>
  <section>
    <p class="eyebrow">Tool</p>
    <h2>${escapeHtml(toolName)}</h2>
    ${toolHtml || fallback}
  </section>
</body>
</html>`
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    }
    return entities[character]!
  })
}
