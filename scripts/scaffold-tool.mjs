import {
  access,
  cp,
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  rename,
  rm,
  writeFile,
} from "node:fs/promises"
import { dirname, join, relative, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import {
  escapeHtml,
  parseFlags,
  required,
  toPascalCase,
  validateIcon,
  validateSlug,
  validateText,
} from "./scaffold-utils.mjs"

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const options = ["domain", "id", "name", "description", "icon", "category"]
const usage = `Usage:
  npm run scaffold:tool -- --domain <domain-id> --id <tool-id> --name <Display Name> --description <text> --icon <LucideIcon> [--category <label>]

Example:
  npm run scaffold:tool -- --domain finance --id budget-planner --name "Budget planner" --description "Plan recurring spending by category." --icon Wallet --category Planning

The command creates a modular tool folder and starter UI. It does not edit the central registry; it prints the required lazy import and registration snippets.`

async function main() {
  const parsed = parseFlags(process.argv.slice(2), options)
  if (parsed.help) {
    console.log(usage)
    return
  }

  const domainId = validateSlug(
    required(parsed.flags, "domain", "--domain finance"),
    "Domain id"
  )
  const id = validateSlug(
    required(parsed.flags, "id", "--id budget-planner"),
    "Tool id"
  )
  const name = validateText(
    required(parsed.flags, "name", '--name "Budget planner"'),
    "Tool name",
    80
  )
  const description = validateText(
    required(
      parsed.flags,
      "description",
      '--description "Plan recurring spending by category."'
    ),
    "Tool description",
    500
  )
  const icon = validateIcon(required(parsed.flags, "icon", "--icon Wallet"))
  const category = validateText(
    parsed.flags.category?.trim() || "General",
    "Tool category",
    80
  )
  const componentBaseName = toPascalCase(id)
  const componentName = componentBaseName.endsWith("Tool")
    ? componentBaseName
    : `${componentBaseName}Tool`
  const domainRoot = join(root, "apps/web/src/domains", domainId)
  const templateRoot = join(
    root,
    "apps/web/src/domains/_template/tools/_tool-template"
  )
  const toolsRoot = join(domainRoot, "tools")
  const domainMetadataPath = join(domainRoot, "config/domain.ts")
  const destination = join(toolsRoot, id)
  let temporary
  let destinationReserved = false

  try {
    await access(domainMetadataPath)
  } catch {
    throw new Error(
      `Domain '${domainId}' does not exist or has no config/domain.ts. Scaffold and register the domain first.`
    )
  }

  try {
    await mkdir(toolsRoot, { recursive: true })
    temporary = await mkdtemp(join(toolsRoot, ".scaffold-tool-"))
    for (const entry of await readdir(templateRoot)) {
      await cp(join(templateRoot, entry), join(temporary, entry), {
        recursive: true,
      })
    }
    await rm(join(temporary, "ExampleTool.tsx"), { force: true })
    const componentSource = [
      'import type { ToolContext } from "@/shared/types/tool"',
      "",
      `export function ${componentName}({ domainId, toolId }: ToolContext) {`,
      "  return (",
      "    <section",
      `      aria-label={${JSON.stringify(name)}}`,
      '      className="rounded-xl border bg-card p-5"',
      "    >",
      `      <h2 className="font-semibold">{${JSON.stringify(name)}}</h2>`,
      `      <p className="mt-1 text-sm text-muted-foreground">{${JSON.stringify(description)}}</p>`,
      '      <p className="mt-4 text-xs text-muted-foreground">Starter tool UI. Replace this section with the feature implementation; keep domain-specific state and services in this module.</p>',
      '      <span className="sr-only">{domainId}: {toolId}</span>',
      "    </section>",
      "  )",
      "}",
      "",
    ].join("\n")
    await writeFile(
      join(temporary, `${componentName}.tsx`),
      componentSource
    )
    await writeFile(
      join(temporary, "config/metadata.ts"),
      `export const toolMetadata = {\n  id: ${JSON.stringify(id)},\n  name: ${JSON.stringify(name)},\n  description: ${JSON.stringify(description)},\n  category: ${JSON.stringify(category)},\n  href: ${JSON.stringify(`/domains/${domainId}/tools/${id}`)},\n} as const\n`
    )
    await writeFile(
      join(temporary, "info.html"),
      `<!doctype html>\n<html lang="en">\n  <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${escapeHtml(name)}</title></head>\n  <body>\n    <section aria-labelledby="tool-overview">\n      <h2 id="tool-overview">${escapeHtml(name)}</h2>\n      <p>${escapeHtml(description)}</p>\n      <h3>How it works</h3>\n      <p>Explain the tool's inputs, outputs, important constraints, and what information it stores.</p>\n      <h3>Data and privacy</h3>\n      <p>Document whether data stays in this browser, is sent to a service, or is shared with workspace members.</p>\n    </section>\n  </body>\n</html>\n`
    )
    await mkdir(destination)
    destinationReserved = true
    for (const entry of await readdir(temporary)) {
      await rename(join(temporary, entry), join(destination, entry))
    }
    await rm(temporary, { recursive: true, force: true })
  } catch (error) {
    if (temporary) await rm(temporary, { recursive: true, force: true })
    if (destinationReserved)
      await rm(destination, { recursive: true, force: true })
    if (error?.code === "EEXIST" || error?.code === "ENOTEMPTY") {
      throw new Error(`Tool already exists: ${relative(root, destination)}`)
    }
    throw error
  }

  const importPath = `@/domains/${domainId}/tools/${id}/${componentName}`
  const registryPath = join(root, "apps/web/src/shared/config/registry.tsx")
  const registryText = await readFile(registryPath, "utf8")
  const existingPlannedTool = new RegExp(
    `plannedTool\\(\\s*["']${domainId}["']\\s*,\\s*["']${id}["']`
  ).test(registryText)
  console.log(`Created ${relative(root, destination)}`)
  console.log(`\nRegister in apps/web/src/shared/config/registry.tsx:\n`)
  console.log(`1. Icon import:\nimport { ${icon} } from "lucide-react"`)
  console.log(
    `\n2. Lazy component (near the other lazy imports):\nconst ${componentName} = lazy(() =>\n  import("${importPath}").then(\n    (module) => ({ default: module.${componentName} })\n  )\n)`
  )
  console.log(
    `\n3. ${existingPlannedTool ? "Replace the existing plannedTool entry in place (do not create a duplicate)" : `Add this entry to registeredTools[${JSON.stringify(domainId)}]; replace an existing same-domain entry with this id instead of duplicating it`}:\n{\n  id: ${JSON.stringify(id)},\n  name: ${JSON.stringify(name)},\n  description: ${JSON.stringify(description)},\n  icon: ${icon},\n  href: ${JSON.stringify(`/domains/${domainId}/tools/${id}`)},\n  category: ${JSON.stringify(category)},\n  component: ${componentName},\n}`
  )
  console.log(
    `\nThen run npm run lint --workspace=web, npm run typecheck --workspace=web, and npm run build --workspace=web. Confirm the imported icon exists in lucide-react and keep access checks on the backend for any protected data/API.`
  )
}

main().catch((error) => {
  console.error(`Tool scaffold failed: ${error.message}`)
  process.exitCode = 1
})
