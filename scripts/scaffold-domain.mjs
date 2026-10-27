import {
  mkdir,
  mkdtemp,
  readdir,
  rename,
  rm,
  writeFile,
} from "node:fs/promises"
import { dirname, join, resolve, relative } from "node:path"
import { fileURLToPath } from "node:url"
import {
  escapeHtml,
  parseFlags,
  required,
  toCamelCase,
  validateIcon,
  validateSlug,
  validateText,
} from "./scaffold-utils.mjs"

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const options = ["id", "name", "description", "icon", "tone"]
const usage = `Usage:
  npm run scaffold:domain -- --id <kebab-case-id> --name <Display Name> --description <text> --icon <LucideIcon> [--tone <token>]

Example:
  npm run scaffold:domain -- --id customer-support --name "Customer Support" --description "Support workflows and customer insights." --icon Headphones --tone cyan

The command creates a domain module only. It does not edit the central registry; it prints the required registration steps after scaffolding.`

async function main() {
  const parsed = parseFlags(process.argv.slice(2), options)
  if (parsed.help) {
    console.log(usage)
    return
  }

  const id = validateSlug(
    required(parsed.flags, "id", "--id analytics"),
    "Domain id"
  )
  const name = validateText(
    required(parsed.flags, "name", '--name "Analytics"'),
    "Domain name",
    80
  )
  const description = validateText(
    required(
      parsed.flags,
      "description",
      '--description "Analyze workspace activity."'
    ),
    "Domain description",
    500
  )
  const icon = validateIcon(required(parsed.flags, "icon", "--icon BarChart3"))
  const tone = parsed.flags.tone?.trim() || "violet"
  if (tone.length > 32 || !/^[a-z][a-z0-9-]*$/.test(tone)) {
    throw new Error("Tone must be a lowercase token such as violet or cyan.")
  }

  const domainsRoot = join(root, "apps/web/src/domains")
  const destination = join(domainsRoot, id)
  const temporary = await mkdtemp(join(domainsRoot, ".scaffold-domain-"))
  let destinationReserved = false
  try {
    await mkdir(join(temporary, "config"), { recursive: true })
    for (const folder of [
      "components",
      "hooks",
      "services",
      "types",
      "utils",
      "tools",
    ]) {
      await mkdir(join(temporary, folder), { recursive: true })
      await writeFile(join(temporary, folder, ".gitkeep"), "")
    }
    await writeFile(
      join(temporary, "config/domain.ts"),
      `import { ${icon} } from "lucide-react"\nimport type { DomainDescriptor } from "@/shared/types/domain"\n\nexport const ${toCamelCase(id)}Domain = {\n  id: ${JSON.stringify(id)},\n  name: ${JSON.stringify(name)},\n  description: ${JSON.stringify(description)},\n  icon: ${icon},\n  tone: ${JSON.stringify(tone)},\n} satisfies DomainDescriptor\n`
    )
    await writeFile(
      join(temporary, "config/security.ts"),
      `/** Domain-level route scope; each tool declares its own data and action contract. */\nexport const domainSecurity = {\n  domainId: ${JSON.stringify(id)},\n  accessGrant: ${JSON.stringify(`domain:${id}:access`)},\n  dataPolicy: "tool-defined",\n  backendPolicy: "tool-defined",\n} as const\n`
    )
    await writeFile(
      join(temporary, "SECURITY.md"),
      `# ${name} domain security\n\nDomain navigation access is governed by the server-issued \`domain:${id}:access\` grant (or broader dashboard/tool grants). This file documents route scope only. Data ownership, backend dependencies, and sensitive action grants belong in each tool folder's \`config/security.ts\` and \`SECURITY.md\`. Backend APIs must enforce grants independently; frontend filtering is not authorization.\n`
    )
    await writeFile(
      join(temporary, "info.html"),
      `<!doctype html>\n<html lang="en">\n  <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${escapeHtml(name)} domain</title></head>\n  <body>\n    <section aria-labelledby="domain-overview">\n      <h2 id="domain-overview">${escapeHtml(name)}</h2>\n      <p>${escapeHtml(description)}</p>\n      <h3>About this domain</h3>\n      <p>Describe the domain's purpose, data ownership, and the workflows it groups.</p>\n    </section>\n  </body>\n</html>\n`
    )
    await writeFile(
      join(temporary, "README.md"),
      `# ${name}\n\n${description}\n\nThis domain owns its config, components, hooks, services, types, utils, and tools. Keep implementation details here unless another domain genuinely reuses them.\n\n## Add a tool\n\nRun the repository's npm run scaffold:tool -- --help command, then register the generated tool in apps/web/src/shared/config/registry.tsx.\n`
    )
    await mkdir(destination)
    destinationReserved = true
    for (const entry of await readdir(temporary)) {
      await rename(join(temporary, entry), join(destination, entry))
    }
    await rm(temporary, { recursive: true, force: true })
  } catch (error) {
    await rm(temporary, { recursive: true, force: true })
    if (destinationReserved)
      await rm(destination, { recursive: true, force: true })
    if (error?.code === "EEXIST" || error?.code === "ENOTEMPTY") {
      throw new Error(`Domain already exists: ${relative(root, destination)}`)
    }
    throw error
  }

  const moduleName = `${toCamelCase(id)}Domain`
  console.log(`Created ${relative(root, destination)}`)
  console.log(
    `\nRegister this domain in apps/web/src/shared/config/registry.tsx:\n`
  )
  console.log(
    `1. Import metadata:\nimport { ${moduleName} } from "@/domains/${id}/config/domain"`
  )
  console.log(
    `\n2. Add an empty tool collection:\n[${JSON.stringify(id)}]: [],`
  )
  console.log(
    `\n3. Add the domain to the exported domains list:\n{ ...${moduleName}, tools: registeredTools[${JSON.stringify(id)}] },`
  )
  console.log(
    `\n4. Add its icon to domainIcons:\n[${JSON.stringify(id)}]: ${icon},`
  )
  console.log(
    "\nThen run npm run lint --workspace=web, npm run typecheck --workspace=web, and npm run build --workspace=web."
  )
}

main().catch((error) => {
  console.error(`Domain scaffold failed: ${error.message}`)
  process.exitCode = 1
})
