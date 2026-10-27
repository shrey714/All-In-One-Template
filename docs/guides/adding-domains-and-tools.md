# Add a domain or tool to Orbit

This guide is for developers extending Orbit safely. It explains the existing module layout, the scaffolding commands, what the generated security declarations mean, how to add a protected API, how to wire dynamic role grants, and how to validate the result. The command-generated files are starting points: review them against the feature's actual data flows before shipping.

## 1. Set up the development environment

Orbit has two independently managed parts: the React/Vite frontend under `apps/web/` and the API-only Node/SQLite service under `backend/`. The backend is intentionally not an npm workspace and does not import or serve the frontend.

From the repository root, install the frontend dependencies and the standalone backend dependencies:

```bash
npm install
npm install --prefix backend --workspaces=false
```

Start the backend and frontend in separate terminals:

```bash
npm run dev --prefix backend
```

```bash
npm run dev --workspace=web
```

Vite forwards `/api` to the backend during development. To create the initial administrator, run `npm run bootstrap:admin --prefix backend` from an interactive terminal and follow the masked prompts. There is no public signup route. The first account can use **Account → Access roles** to create role bundles and **Account → Manage users** to provision later users. For authentication configuration, deployment setup, and production reverse-proxy requirements, see the root [README](../../README.md).

## 2. Understand the module layout

Domain modules live in `apps/web/src/domains/<domain-id>/`. Each domain has its own `components/`, `config/`, `hooks/`, `services/`, `types/`, `utils/`, and `tools/`. A tool is independently owned under `tools/<tool-id>/` and has the same module boundaries. Place code in the narrowest owning module; promote it to `apps/web/src/shared/` only when multiple domains genuinely need it.

| Path | Responsibility |
| --- | --- |
| `config/domain.ts` | Domain ID, display name, description, icon, and tone. |
| `config/metadata.ts` | Tool metadata such as ID, name, description, category, and route. |
| `config/security.ts` | Machine-readable declaration of domain/tool access and data/action scope. It is review metadata, not enforcement. |
| `components/` | Reusable UI owned by that domain or tool. |
| `hooks/` | Domain/tool-local React behavior and state coordination. |
| `services/` | Domain/tool API clients and integration boundaries. |
| `types/` | Domain/tool-specific TypeScript contracts. |
| `utils/` | Pure formatting, parsing, and calculation helpers local to that module. |
| `info.html` | Human-readable details rendered by the Explorer's sandboxed Info sheet. |
| `SECURITY.md` | Human-reviewed record of storage, data handling, backend needs, and sensitive operations. |

The existing domains and all 28 current tool folders have been normalized to this layout. Some are intentionally poster-only; their empty folders are ready for future implementation. The two currently implemented tools use device-local state. Cron Helper intentionally exercises the per-tool error boundary. Do not interpret an empty module folder as shipped functionality.

## 3. Scaffold a domain and tool

Run commands from the repository root. IDs must be lowercase kebab-case. Scaffold a domain before its tools:

```bash
npm run scaffold:domain -- --id customer-support --name "Customer Support" --description "Support workflows and customer insights." --icon Headphones --tone cyan
```

Then scaffold a tool with explicit security decisions:

```bash
npm run scaffold:tool -- --domain customer-support --id response-library --name "Response library" --description "Organize reusable support responses." --icon BookOpen --category Writing --data-scope workspace --backend yes --actions export,delete
```

Use `npm run scaffold:domain -- --help` and `npm run scaffold:tool -- --help` to see all options. The tools validate identifiers and text, reject unsupported flags, and refuse to overwrite existing modules. They do not edit `apps/web/src/shared/config/registry.tsx` automatically; that file controls route discovery and is intentionally left for an explicit reviewed edit.

### Choose the data scope honestly

`--data-scope` is a design declaration; it does not create storage or enforce access. Choose the narrowest accurate value:

| Value | Meaning | Typical implementation |
| --- | --- | --- |
| `none` | The tool has no saved tool data. | Ephemeral calculation or a poster-only placeholder. |
| `device` | Data stays in one browser/device and is not synchronized to an account. | Local-only preferences, a URL-backed calculation, or browser-local draft. Do not describe this as user-synced or shared. |
| `user` | Data belongs to one authenticated account and must not be visible to another account. | Authenticated API and server-derived user ownership; never trust a client-supplied user ID. |
| `workspace` | Data is intentionally shared by members of one workspace/tenant. | Authenticated API and server-derived workspace ownership, plus permission and tenant-isolation checks. |

User- and workspace-scoped data normally requires the backend (`--backend yes`) so ownership can be enforced and data can be isolated. A local browser key is not a secure substitute for server-owned user/workspace records. If the scope or sensitivity is not yet decided, keep the data ephemeral and resolve the policy before persistence.

### Declare backend dependencies and sensitive actions

Set `--backend yes` if the tool needs server-side storage, protected records, external credentials, privileged operations, or an API that must enforce roles. Set `--backend no` only when the feature is genuinely client-only. Action IDs are stable kebab-case identifiers such as `export`, `delete`, or `approve`. Use `--actions none` when no sensitive action exists. The scaffolder rejects action declarations when `--backend no` is selected.

The generator creates:

- A starter React component, metadata, `info.html`, and security checklist under the tool module.
- `config/security.ts` with the selected data scope, backend flag, tool access grant, and the derived feature-action grants.
- If `--backend yes`, a protected example router under `backend/src/tools/<domain>/<tool>/router.ts` and a colocated root-level backend test file named `<domain>-<tool>.test.ts`.
- Copyable frontend registry and backend router-mount instructions. Review them; the central registry and API app are not rewritten automatically.

The generated router has authentication middleware and a guard at each operation. For a sensitive action, it calls `requireFeaturePermission` with the generated domain/tool/feature/action tuple. For a general tool operation with `--actions none`, it calls `requireToolAccess`. Its response is intentionally `501 Not implemented.` until you replace the placeholder with real server-side behavior. Do not expose a placeholder route as a finished feature.

## 4. Understand grants and role assignment

Orbit uses database-backed, deny-by-default roles. Users can hold multiple roles; effective permissions are the union of those roles' grants. A successful login does not imply dashboard permission. The account needs `dashboard:access` and an applicable tool grant to enter and use a tool.

Common grants are:

```text
dashboard:access
tools:use
domain:customer-support:access
tool:customer-support/response-library:access
feature:customer-support/response-library/response-library:export
feature:customer-support/response-library/response-library:delete
```

`tools:use` grants broad access to all registered tools. A matching domain grant or exact tool grant can instead scope access. Every user still needs `dashboard:access` for the authenticated workspace. A feature/action grant does not automatically make the API safe: the handler must explicitly check it at the point of the operation. There are no explicit deny rules, so grants from multiple roles accumulate.

After the tool is registered, create or update an assignable role in **Account → Access roles** and include only the needed grants; then assign that role to accounts in **Account → Manage users**. Role managers are limited to delegating grants they themselves hold. The frontend may hide unavailable controls for usability, but the backend is authoritative. See the detailed [RBAC contract](../architecture/rbac.md).

## 5. Implement and mount the API safely

When you select a backend dependency:

1. Review the generated router and its exact grant IDs. Ensure each route checks the narrowest applicable grant before reading or mutating protected data.
2. Implement the operation using a trusted session-derived identity. Derive `user_id` and workspace/tenant identity on the server; never authorize based on request-body or query-string owner IDs.
3. Validate request schemas and resource identifiers. Use parameterized database queries, avoid leaking secrets or sensitive data in errors/logs, and define transaction, retention, deletion, and audit behavior where appropriate.
4. Mount the router in `backend/src/app.ts` at the printed `/api/tools/<domain>/<tool>` path using the existing database and configured inactivity timeout. Confirm the import path and middleware order in the current app.
5. Extend the generated test or add tests for every route and data boundary. Test an anonymous request (401), a signed-in account without the grant (403), an authorized account, malformed input, cross-user/workspace access denial, and mutation/audit behavior as relevant.

The generated integration test uses Orbit's actual session and grant middleware with an in-memory SQLite database and HTTP requests. Its baseline checks that anonymous requests receive 401, authenticated users without grants receive 403, and authorized requests pass the guard (the unimplemented placeholder then returns 501). Keep generated tests in `backend/src/` with the `.test.ts` suffix; `npm test --prefix backend` compiles and runs `dist/*.test.js`.

Do not place an API key or other secret in frontend code, the security manifest, a URL, local storage, or `info.html`. Use server environment variables or a secret manager for credentials, and restrict external network access to the minimum required destinations.

## 6. Register and validate

Apply the scaffolder's printed frontend snippet in `apps/web/src/shared/config/registry.tsx`: add the icon import, lazy component import, and entry inside `registeredTools[domainId]`. Replace an existing planned-tool entry for the same domain and ID rather than adding a duplicate. For a new domain, add its domain descriptor, empty or populated tools list, and icon mapping as instructed. Review `href`, component, availability, optional docks, and settings declarations. The router derives ordinary tool routes from this registry; do not add unrelated route-table entries.

Edit both domain and tool `info.html` files so the Info sheet explains purpose, operation, assumptions, inputs/outputs, and data/privacy behavior. Keep these documents static and safe; the viewer uses a sandboxed frame without script execution.

Run the frontend checks:

```bash
npm run lint --workspace=web
npm run typecheck --workspace=web
npm run build --workspace=web
```

If the backend changed, also run:

```bash
npm run lint --prefix backend
npm run typecheck --prefix backend
npm test --prefix backend
```

Check `git diff --check`, inspect every generated file, and verify both allowed and denied behavior before merging. A green frontend build cannot prove backend authorization is correct.

## 7. Before shipping: review checklist

- Does the selected data scope match the real persistence and sharing behavior?
- Are account and workspace ownership derived from a validated server session?
- Are all sensitive actions listed with stable IDs and checked server-side?
- Does every endpoint fail closed for anonymous users and users without grants?
- Are cross-user and cross-workspace reads/writes explicitly tested?
- Are errors safe, secrets kept server-side, and changes audited where required?
- Are retention, deletion, export, migration, and backup behaviors documented?
- Is the domain/tool registered exactly once and are its Info pages accurate?
- Have frontend and backend checks both passed?

For preference-specific ownership and migration rules, read [preference and data scopes](../architecture/preference-and-data-scopes.md). For role grant semantics and delegation safeguards, read [dynamic RBAC](../architecture/rbac.md). For the copyable source templates, see [`apps/web/src/domains/_template`](../../apps/web/src/domains/_template/README.md).
