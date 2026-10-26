import { resolve } from "node:path"
import { existsSync, readFileSync } from "node:fs"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

const orbitConfig: unknown = JSON.parse(
  readFileSync(resolve(import.meta.dirname, "../../orbit.config.json"), "utf8")
)

type RecordValue = Record<string, unknown>

function isRecord(value: unknown): value is RecordValue {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function requiredText(source: RecordValue, key: string, maxLength: number) {
  const value = source[key]
  if (
    typeof value !== "string" ||
    value.trim().length === 0 ||
    value.length > maxLength
  ) {
    throw new Error(
      `orbit.config.json branding.${key} must be a non-empty string of at most ${maxLength} characters.`
    )
  }
  return value
}

function assetPath(source: RecordValue, key: string) {
  const value = requiredText(source, key, 240)
  if (
    !/^\/(?:[A-Za-z0-9_-][A-Za-z0-9._-]*\/)*[A-Za-z0-9_-][A-Za-z0-9._-]*\.(?:svg|png|webp|ico)$/i.test(
      value
    )
  ) {
    throw new Error(
      `orbit.config.json branding.${key} must be a root-relative SVG, PNG, WebP, or ICO path in apps/web/public.`
    )
  }
  if (!existsSync(resolve(import.meta.dirname, "public", value.slice(1)))) {
    throw new Error(
      `orbit.config.json branding.${key} points to a missing frontend asset: apps/web/public${value}.`
    )
  }
  return value
}

function hexColor(source: RecordValue, key: string, parent: string) {
  const value = source[key]
  if (typeof value !== "string" || !/^#[0-9a-fA-F]{6}$/.test(value)) {
    throw new Error(
      `orbit.config.json branding.colors.${parent}.${key} must be a six-digit hex color.`
    )
  }
  return value.toUpperCase()
}

function linearChannel(value: number) {
  const channel = value / 255
  return channel <= 0.04045
    ? channel / 12.92
    : ((channel + 0.055) / 1.055) ** 2.4
}

function relativeLuminance(hex: string) {
  const channels = hex
    .slice(1)
    .match(/.{2}/g)!
    .map((channel) => linearChannel(Number.parseInt(channel, 16)))
  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722
}

function contrastRatio(first: string, second: string) {
  const luminances = [relativeLuminance(first), relativeLuminance(second)].sort(
    (left, right) => right - left
  )
  return (luminances[0] + 0.05) / (luminances[1] + 0.05)
}

function validateBranding(config: unknown) {
  if (!isRecord(config) || !isRecord(config.branding)) {
    throw new Error("orbit.config.json must define a branding object.")
  }
  const branding = config.branding
  requiredText(branding, "shortName", 32)
  requiredText(branding, "productName", 64)
  requiredText(branding, "tagline", 200)
  assetPath(branding, "logoPath")
  assetPath(branding, "faviconPath")
  requiredText(branding, "supportLabel", 64)
  const supportUrl = branding.supportUrl
  if (typeof supportUrl !== "string" || supportUrl.length > 512) {
    throw new Error(
      "orbit.config.json branding.supportUrl must be a URL string."
    )
  }
  if (supportUrl) {
    let parsed: URL
    try {
      parsed = new URL(supportUrl)
    } catch {
      throw new Error(
        "orbit.config.json branding.supportUrl must be an HTTPS URL or mailto link."
      )
    }
    if (
      !["https:", "mailto:"].includes(parsed.protocol) ||
      parsed.username ||
      parsed.password
    ) {
      throw new Error(
        "orbit.config.json branding.supportUrl must be an HTTPS URL or mailto link without credentials."
      )
    }
  }
  if (!isRecord(branding.signIn)) {
    throw new Error("orbit.config.json branding.signIn must be an object.")
  }
  requiredText(branding.signIn, "eyebrow", 48)
  requiredText(branding.signIn, "headline", 96)
  requiredText(branding.signIn, "description", 240)
  requiredText(branding.signIn, "formTitle", 64)
  requiredText(branding.signIn, "formDescription", 160)
  requiredText(branding.signIn, "submitLabel", 32)
  requiredText(branding.signIn, "footerNote", 160)
  if (!isRecord(branding.colors)) {
    throw new Error("orbit.config.json branding.colors must be an object.")
  }
  for (const mode of ["light", "dark"] as const) {
    const palette = branding.colors[mode]
    if (!isRecord(palette)) {
      throw new Error(
        `orbit.config.json branding.colors.${mode} must be an object.`
      )
    }
    const primary = hexColor(palette, "primary", mode)
    const foreground = hexColor(palette, "primaryForeground", mode)
    if (contrastRatio(primary, foreground) < 4.5) {
      throw new Error(
        `branding.colors.${mode} primaryForeground must have at least 4.5:1 contrast against primary.`
      )
    }
  }
}

validateBranding(orbitConfig)
const config = orbitConfig as {
  branding: {
    shortName: string
    productName: string
    tagline: string
    faviconPath: string
    colors: {
      light: { primary: string; primaryForeground: string }
      dark: { primary: string; primaryForeground: string }
    }
  }
}

const brandStylesheet = () => {
  const { branding } = config
  return `:root{--orbit-brand-light-primary:${branding.colors.light.primary};--orbit-brand-light-primary-foreground:${branding.colors.light.primaryForeground}}.dark{--orbit-brand-dark-primary:${branding.colors.dark.primary};--orbit-brand-dark-primary-foreground:${branding.colors.dark.primaryForeground}}`
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

// https://vite.dev/config/
export default defineConfig({
  define: {
    __ORBIT_CONFIG__: JSON.stringify(orbitConfig),
  },
  plugins: [
    react(),
    tailwindcss(),
    {
      name: "orbit-white-label-html",
      configureServer(server) {
        server.middlewares.use("/orbit-branding.css", (_request, response) => {
          response.setHeader("Content-Type", "text/css; charset=utf-8")
          response.end(brandStylesheet())
        })
      },
      generateBundle() {
        this.emitFile({
          type: "asset",
          fileName: "orbit-branding.css",
          source: brandStylesheet(),
        })
      },
      transformIndexHtml(html) {
        const { branding } = config
        return html
          .replace(
            /<link rel="icon"[^>]*>/i,
            `<link rel="icon" href="${branding.faviconPath}" />`
          )
          .replace(
            /<meta name="description"[^>]*>/i,
            `<meta name="description" content="${escapeHtml(branding.tagline)}" />`
          )
          .replace(
            /<meta name="theme-color"[^>]*>/i,
            `<meta name="theme-color" content="${branding.colors.light.primary}" />`
          )
          .replace(
            /<title>[\s\S]*?<\/title>/i,
            `<title>${escapeHtml(branding.productName)}</title>`
          )
          .replace(
            "</head>",
            '<link rel="stylesheet" href="/orbit-branding.css" /></head>'
          )
      },
    },
  ],
  resolve: {
    alias: {
      "@": resolve(import.meta.dirname, "./src"),
    },
  },
  server: {
    proxy: {
      "/api": {
        target: "http://127.0.0.1:3001",
        changeOrigin: false,
      },
    },
  },
})
