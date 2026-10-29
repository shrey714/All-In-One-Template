import { realpath, stat } from "node:fs/promises"
import { isAbsolute, relative, resolve, sep } from "node:path"

export function parseFlags(argv, allowed) {
  const flags = {}
  for (let index = 0; index < argv.length; index += 1) {
    const flag = argv[index]
    if (flag === "--help" || flag === "-h") return { help: true, flags }
    if (!flag.startsWith("--")) {
      throw new Error(`Unexpected argument: ${flag}. Use --help for usage.`)
    }
    const name = flag.slice(2)
    if (!allowed.includes(name)) {
      throw new Error(`Unknown option --${name}. Use --help for usage.`)
    }
    if (flags[name] !== undefined)
      throw new Error(`Option --${name} was repeated.`)
    const value = argv[index + 1]
    if (!value || value.startsWith("--")) {
      throw new Error(`Option --${name} requires a value.`)
    }
    flags[name] = value
    index += 1
  }
  return { help: false, flags }
}

export function required(flags, name, example) {
  const value = flags[name]?.trim()
  if (!value) throw new Error(`Missing --${name}. Example: ${example}`)
  return value
}

export function validateText(value, label, maxLength) {
  if (value.length > maxLength) {
    throw new Error(`${label} must be ${maxLength} characters or fewer.`)
  }
  if (/[\u0000-\u001f\u007f]/.test(value)) {
    throw new Error(`${label} must not contain control characters or newlines.`)
  }
  return value
}

export function toPascalCase(slug) {
  return slug
    .split("-")
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join("")
}

export function toCamelCase(slug) {
  const pascal = toPascalCase(slug)
  return pascal[0].toLowerCase() + pascal.slice(1)
}

export function escapeHtml(value) {
  return value.replace(/[&<>"']/g, (character) => {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    }
    return entities[character]
  })
}

export function validateSlug(slug, label) {
  if (slug.length > 48 || !/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/.test(slug)) {
    throw new Error(
      `${label} must be lowercase kebab-case, start with a letter, and contain only letters, numbers, or single hyphens.`
    )
  }
  if (slug === "_template") throw new Error(`${label} cannot be _template.`)
  return slug
}

export function validateIcon(icon) {
  if (!/^[A-Z][A-Za-z0-9]*$/.test(icon)) {
    throw new Error(
      "Icon must be a PascalCase lucide-react export, e.g. Wrench."
    )
  }
  return icon
}

export async function validateImageIcon(value, publicRoot) {
  if (!value || value.length > 2048 || /[\u0000-\u001f\u007f]/.test(value)) {
    throw new Error(
      "Image icon source is empty, too long, or contains control characters."
    )
  }

  try {
    const url = new URL(value)
    if (url.protocol !== "https:" || url.username || url.password) {
      throw new Error(
        "Remote image icons must use HTTPS and must not include credentials."
      )
    }
    return url.href
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.startsWith("Remote image icons")
    ) {
      throw error
    }
  }

  if (!value.startsWith("/") || value.startsWith("//")) {
    throw new Error(
      "Local image icons must use a root-relative path such as /brand/orbit.svg; remote icons must use HTTPS."
    )
  }
  const rawSegments = value.slice(1).split("/")
  let segments
  try {
    segments = rawSegments.map((segment) => decodeURIComponent(segment))
  } catch {
    throw new Error("Local image icon paths must use valid URL encoding.")
  }
  if (
    segments.some(
      (segment) =>
        !segment ||
        segment === "." ||
        segment === ".." ||
        /[\\/?#\u0000-\u001f\u007f]/.test(segment)
    ) ||
    !/\.(?:avif|gif|ico|jpe?g|png|svg|webp)$/i.test(segments.at(-1))
  ) {
    throw new Error(
      "Local image icons must point to an image file (SVG, PNG, JPEG, WebP, AVIF, GIF, or ICO) under apps/web/public."
    )
  }

  try {
    const publicRealPath = await realpath(publicRoot)
    const imageRealPath = await realpath(resolve(publicRealPath, ...segments))
    const relativePath = relative(publicRealPath, imageRealPath)
    if (
      relativePath === ".." ||
      relativePath.startsWith(`..${sep}`) ||
      isAbsolute(relativePath) ||
      !(await stat(imageRealPath)).isFile()
    ) {
      throw new Error(
        "The local image icon must be a file within apps/web/public."
      )
    }
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.startsWith("The local image icon")
    ) {
      throw error
    }
    throw new Error(
      `Local image icon not found under apps/web/public: ${value}`
    )
  }

  return value
}
