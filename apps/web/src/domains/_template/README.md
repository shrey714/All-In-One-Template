# Domain template

Prefer the repository scaffolder for new modules. It creates this modular layout, starter metadata and HTML info pages, and prints the registration snippets without editing the central registry automatically.

```bash
npm run scaffold:domain -- --id customer-support --name "Customer Support" --description "Support workflows and customer insights." --icon Headphones --tone cyan
npm run scaffold:tool -- --domain customer-support --id response-library --name "Response library" --description "Organize reusable support responses." --icon BookOpen --category Writing
```

Run either command with `--help` for the required arguments. IDs must be lowercase kebab-case. The tool command requires a domain module to exist first. Both commands refuse to overwrite existing directories; review and apply their output in `apps/web/src/shared/config/registry.tsx`, then lint, typecheck, and build the web workspace.

A domain owns its `config`, `components`, `hooks`, `services`, `types`, `utils`, and `tools`. Each independently registered tool gets its own `components`, `config`, `hooks`, `services`, `types`, and `utils` subfolders. Keep domain-only behavior within the domain. Promote code to `shared/` only when more than one domain genuinely reuses it.

Edit the generated `info.html` files to explain the domain or tool, usage, and data/privacy behavior. The Info sheet renders these documents in a sandboxed frame. Keep metadata in the module's config folder; keep route, availability, dock, and settings registration in the central registry. Never treat frontend visibility or tool availability as authorization for protected backend data—enforce access in the backend.
