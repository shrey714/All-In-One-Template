# Domain template

Prefer the repository scaffolder for new modules. It creates this modular layout, starter metadata and HTML info pages, and prints the registration snippets without editing the central registry automatically.

```bash
npm run scaffold:domain -- --id customer-support --name "Customer Support" --description "Support workflows and customer insights." --icon Headphones --tone cyan
npm run scaffold:tool -- --domain customer-support --id response-library --name "Response library" --description "Organize reusable support responses." --icon BookOpen --category Writing --data-scope workspace --backend yes --actions export,delete
```

Run either command with `--help` for the required arguments. IDs must be lowercase kebab-case. Tool scaffolding requires explicit `--data-scope none|device|user|workspace`, `--backend yes|no`, and `--actions none|action-id,...` declarations. Sensitive actions require a backend. When enabled, the generator creates a protected API router and runnable HTTP boundary tests that use real session middleware; the test suite checks anonymous, authenticated-but-unauthorized, and authorized requests. Both commands refuse to overwrite existing files; review and apply the printed frontend registration and backend mount snippets, then lint, typecheck, build, and run `npm test --prefix backend`.

A domain owns its `config`, `components`, `hooks`, `services`, `types`, `utils`, and `tools`. Each independently registered tool gets its own `components`, `config`, `hooks`, `services`, `types`, and `utils` subfolders. Keep domain-only behavior within the domain. Promote code to `shared/` only when more than one domain genuinely reuses it.

Edit the generated `info.html` and `SECURITY.md` files to explain usage, storage location, retention, sharing, and privacy. `config/security.ts` is a reviewable declaration, not an enforcement mechanism. The generated backend example uses `requireToolAccess` for tool operations and `requireFeaturePermission` for each declared sensitive action. Mount the router in the API and replace its 501 placeholder only after writing the authorized server-side operation. Keep route, availability, dock, and settings registration in the central frontend registry. Never treat frontend visibility or tool availability as authorization for protected backend data—enforce access at every API boundary.
