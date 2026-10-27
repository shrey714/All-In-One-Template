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
import {
  createApiRouterSource,
  createApiTestSource,
} from "./scaffold-tool-backend.mjs"

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const options = [
  "domain",
  "id",
  "name",
  "description",
  "icon",
  "category",
  "data-scope",
  "backend",
  "actions",
]
const usage = `Usage:
  npm run scaffold:tool -- --domain <domain-id> --id <tool-id> --name <Display Name> --description <text> --icon <LucideIcon> --data-scope <none|device|user|workspace> --backend <yes|no> --actions <none|action-id,...> [--category <label>]

Example:
  npm run scaffold:tool -- --domain finance --id budget-planner --name "Budget planner" --description "Plan recurring spending by category." --icon Wallet --category Planning --data-scope user --backend yes --actions export,delete

Declare actions as stable kebab-case IDs. For backend=no, actions must be none. The command creates a modular tool folder and starter UI; when backend=yes it also creates a protected API router and runnable authorization tests under backend/src. It does not edit the central registry; it prints registration and API mount snippets.`

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
  const dataScope = required(parsed.flags, "data-scope", "--data-scope user")
  if (!["none", "device", "user", "workspace"].includes(dataScope)) {
    throw new Error("--data-scope must be none, device, user, or workspace.")
  }
  const backendDependency = required(parsed.flags, "backend", "--backend yes")
  if (!["yes", "no"].includes(backendDependency)) {
    throw new Error("--backend must be yes or no.")
  }
  if (
    ["user", "workspace"].includes(dataScope) &&
    backendDependency !== "yes"
  ) {
    throw new Error(
      "User- and workspace-scoped data require --backend yes so ownership can be enforced server-side."
    )
  }
  const actionInput = required(parsed.flags, "actions", "--actions none")
  const sensitiveActions =
    actionInput === "none"
      ? []
      : [
          ...new Set(
            actionInput
              .split(",")
              .map((action) =>
                validateSlug(action.trim(), "Sensitive action id")
              )
          ),
        ]
  if (actionInput !== "none" && sensitiveActions.length === 0) {
    throw new Error("--actions must be none or a comma-separated action list.")
  }
  if (backendDependency === "no" && sensitiveActions.length > 0) {
    throw new Error(
      "Sensitive actions require --backend yes so grants can be enforced at the API boundary."
    )
  }
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
  const backendDestination = join(root, "backend/src/tools", domainId, id)
  const backendTestPath = join(root, "backend/src", `${domainId}-${id}.test.ts`)
  let temporary
  let destinationReserved = false

  try {
    await access(domainMetadataPath)
  } catch {
    throw new Error(
      `Domain '${domainId}' does not exist or has no config/domain.ts. Scaffold and register the domain first.`
    )
  }

  if (backendDependency === "yes") {
    for (const path of [backendDestination, backendTestPath]) {
      try {
        await access(path)
        throw new Error(
          `Backend tool scaffold already exists: ${relative(root, path)}`
        )
      } catch (error) {
        if (error.code !== "ENOENT") throw error
      }
    }
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
    await writeFile(join(temporary, `${componentName}.tsx`), componentSource)
    await writeFile(
      join(temporary, "config/metadata.ts"),
      `export const toolMetadata = {\n  id: ${JSON.stringify(id)},\n  name: ${JSON.stringify(name)},\n  description: ${JSON.stringify(description)},\n  category: ${JSON.stringify(category)},\n  href: ${JSON.stringify(`/domains/${domainId}/tools/${id}`)},\n} as const\n`
    )
    await writeFile(
      join(temporary, "config/security.ts"),
      `/** Review and update this contract whenever data storage or privileged behavior changes. */\nexport const toolSecurity = {\n  dataScope: ${JSON.stringify(dataScope)},\n  backendRequired: ${backendDependency === "yes"},\n  sensitiveActions: ${JSON.stringify(sensitiveActions)},\n  sensitiveActionGrants: ${JSON.stringify(
        sensitiveActions.map(
          (action) => `feature:${domainId}/${id}/${id}:${action}`
        ),
        null,
        2
      )},\n  toolAccessGrant: ${JSON.stringify(`tool:${domainId}/${id}:access`)},\n} as const\n`
    )
    await writeFile(
      join(temporary, "SECURITY.md"),
      `# ${name}: security and data contract\n\n- **Data scope:** ${dataScope}\n- **Backend dependency:** ${backendDependency}\n- **Sensitive actions:** ${sensitiveActions.length ? sensitiveActions.join(", ") : "none declared"}\n\nDocument storage location, retention, export/deletion behavior, and whether data is shared. This declaration is review metadata, not enforcement by itself. For protected data or actions, enforce grants in backend routes and test allowed, denied, and anonymous requests. Never rely on hidden frontend controls for authorization.\n`
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
    if (backendDependency === "yes") {
      await mkdir(backendDestination, { recursive: true })
      await writeFile(
        join(backendDestination, "router.ts"),
        createApiRouterSource({
          domainId,
          id,
          componentName,
          actions: sensitiveActions,
        })
      )
      await writeFile(
        backendTestPath,
        createApiTestSource({
          domainId,
          id,
          componentName,
          actions: sensitiveActions,
        })
      )
    }
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
  if (backendDependency === "yes") {
    console.log(
      `\n4. Mount the generated API router in backend/src/app.ts:\nimport { create${componentName}Api } from "./tools/${domainId}/${id}/router.js"\napp.use("/api/tools/${domainId}/${id}", create${componentName}Api(database, config.auth.inactivityTimeoutMinutes))\n\nGenerated HTTP boundary test: ${relative(root, backendTestPath)}`
    )
  }
  console.log(
    `\nThen run npm run lint --workspace=web, npm run typecheck --workspace=web, and npm run build --workspace=web${backendDependency === "yes" ? "; also run npm run lint --prefix backend, npm run typecheck --prefix backend, and npm test --prefix backend" : ""}. Confirm the imported icon exists in lucide-react and never treat UI visibility as security enforcement.`
  )
}

main().catch((error) => {
  console.error(`Tool scaffold failed: ${error.message}`)
  process.exitCode = 1
})
