# Orbit — scalable multi-domain tools workspace

Orbit is a React dashboard built on the existing **Vite + React Router + Tailwind CSS v4 + Shadcn monorepo**. Domain and tool features belong to `apps/web`; reusable Shadcn primitives belong to `packages/ui` and are imported through `@workspace/ui`.

## Run and validate

```bash
npm install
```

Orbit authentication is an API-only service in the top-level `backend/` directory. It is not an npm workspace under `apps/`, has its own package and lockfile, and neither imports nor serves the frontend. During development, Vite proxies `/api` to it. In two terminals, install/start the backend and frontend separately:

```bash
npm install --prefix backend --workspaces=false
npm run dev --prefix backend
```

```bash
npm run dev --workspace=web
```

For backend validation, run `npm run lint --prefix backend`, `npm run typecheck --prefix backend`, and `npm test --prefix backend` separately; the backend is intentionally not included in the frontend Turbo workspace.

Create the first administrator once from an interactive terminal. The password is entered masked and is not passed on the command line:

```bash
npm run bootstrap:admin --prefix backend
```

There is no public signup endpoint. Admins provision Member/Admin accounts from **Account → Manage users**; new users must change their temporary password at first sign-in. SQLite data is stored under `backend/data/` and ignored by Git. For production, build the two projects separately. Host the frontend and API behind a same-origin reverse proxy that forwards `/api` to the backend; set `ORBIT_WEB_ORIGIN` to the public HTTPS origin so the API validates browser write requests and marks session cookies secure:

Global authentication behavior is configured in the repository-root `orbit.config.json`. Set `auth.enabled` to `false` to allow dashboard access without sign-in; this makes the workspace available to anyone who can reach it, so use that only on a trusted/private network. Set `auth.inactivityTimeoutMinutes` to the desired idle duration (or `0` to disable idle expiry while leaving authentication enabled). `auth.warningBeforeTimeoutSeconds` controls how early the “Still there?” popup appears. Frontend config is embedded at Vite startup/build and backend config is read at backend startup, so restart Vite and the backend after changing these values. Keep the frontend and backend on the same root config for consistent behavior.

```bash
npm run build --workspace=web
npm run build --prefix backend
NODE_ENV=production ORBIT_WEB_ORIGIN=https://orbit.example.com npm start --prefix backend
```

```bash
npm run lint
npm run typecheck
npm run build --workspace=web
```

## Workspace experience

- Floating, VS Code-inspired work surface with distinct activity rail, explorer, draggable divider, toolbar, content pane, and status bar.
- The activity rail switches the sidebar between **Explorer**, **Pinned**, and **Recent** views. Domain groups can collapse, and the divider supports drag and keyboard resizing.
- Collapse the sidebar to icon-only navigation for the currently selected view; the sidebar width, view, and collapsed state persist locally.
- Light, dark, and system themes; compact layout and status-bar controls; settings persist locally.
- One global search/command palette in the toolbar (`⌘K` / `Ctrl+K`); the sidebar filter is intentionally scoped to its selected view. Shortcut help (`?`), sidebar toggle (`⌘B` / `Ctrl+B`), and settings (`⌘,` / `Ctrl+,`) each have a single primary control.
- Use each Explorer tool’s three-dot menu to favorite it or pin/unpin it. Favorites use a star and a small yellow dot beside the tool name; active-route styling is independent. Up to five pinned tools are shown in a compact Explorer quick-access group and in the Pinned view. Recently opened tools are kept in the Recent view, which can be cleared locally.
- Choose **Info** from a tool’s three-dot menu to open its right-side detail sheet, combining domain and tool documentation. Add `info.html` under the domain folder and under each tool folder; these local HTML fragments are loaded on demand and rendered in a sandboxed iframe without script execution.
- Search and route links support direct deep links.
- Responsive shell: on narrow viewports, open the command palette to navigate without the desktop explorer.

## Source layout

```text
apps/web/
├── e2e/                               # Browser-test scaffold
└── src/
    ├── App.tsx                        # Route composition; tools resolve via catalog
    ├── main.tsx                       # Vite entry and provider composition
    ├── app/
    │   ├── AppShell.tsx               # Resizable workspace layout and global portals
    │   ├── errors/                    # Route error boundary and fallbacks
    │   ├── layouts/                   # Layout boundary exports
    │   ├── pages/                     # Overview and domain landing pages
    │   ├── providers/                 # Theme/provider entry points
    │   └── routes/                    # Reusable route path helpers
    ├── domains/
    │   ├── _template/                 # Copyable domain + tool module template
    │   ├── finance/
    │   │   ├── config/ components/ hooks/ services/ types/ utils/
    │   │   └── tools/emi-calculator/  # Tool-owned UI, hooks, services, types, utils
    │   ├── productivity/
    │   │   ├── config/ components/ hooks/ services/ types/ utils/
    │   │   └── tools/pomodoro-timer/  # Tool-owned UI, hooks, services, types, utils
    │   └── health/                    # Registered, empty starter domain
    ├── shared/
    │   ├── components/                # Layout, dialogs, forms, feedback, display, nav
    │   ├── config/                    # App config, routes, central tool/domain catalog
    │   ├── constants/                 # Cross-domain defaults
    │   ├── hooks/                     # Persistence and workspace shortcuts
    │   ├── lib/                       # Shared implementation helpers
    │   ├── services/                  # API, analytics, recent tools, pinned tools
    │   ├── types/                     # Domain and tool contracts
    │   └── utils/                     # Cross-domain formatting utilities
    ├── __tests__/                     # App test scaffold
    └── test-utils/                    # Shared test utilities scaffold

packages/ui/
├── src/components/                    # Shadcn components shared across apps
├── src/hooks/                         # UI-package hooks
├── src/lib/                           # UI-package utilities
└── src/styles/globals.css             # Shared Tailwind v4 tokens and theme

backend/                                # Standalone Node API + SQLite auth store
├── src/                                # Sessions, password hashing, RBAC and routes
├── data/                               # Local SQLite database (git-ignored)
└── package.json                        # Independent package manifest and lockfile
```

**Ownership rule:** keep behavior local to its domain or tool. Promote it to `shared/` only when multiple domains need it. For reusable visual primitives, use `packages/ui` so Shadcn’s monorepo-aware CLI can manage them.

## Add a domain or tool

1. Copy `apps/web/src/domains/_template` and replace its domain metadata; the `components`, `config`, `hooks`, `services`, `types`, `utils`, and `tools` boundaries are ready.
2. Create a tool folder from `domains/_template/tools/_tool-template`. Keep tool-specific presentation, state, API integration, models, and calculations inside it.
3. Register the domain descriptor and tool metadata/component in `shared/config/registry.tsx`. Tool URLs are derived from registry entries; ordinary additions do **not** require new route-table code.
4. Add tests and optional API/analytics integration only when the feature needs them. The API and analytics modules currently provide lightweight boundaries, not a live backend.

The Health domain shows the intended empty-domain experience without shipping placeholder functionality.

## Routes and shareable state

- `/login` — username/password sign-in; there is no public account creation route
- `/change-password` — first-login temporary-password change and voluntary password updates
- `/admin/users` — Admin-only account provisioning, role management and deactivation
- `/` — workspace overview
- `/domains/:domainId` — domain landing page, including a useful empty state
- `/domains/:domainId/tools/:toolId` — tool page
- `/domains/:domainId/tools/:toolId/steps/:stepId` — step-level deep link
- EMI inputs are query-string backed; Pomodoro duration/session state is URL backed.

## Shadcn monorepo workflow

The app and shared UI packages have matching `components.json` monorepo configuration. From `apps/web`, add a reusable component by name:

```bash
npx shadcn@4.21.4 add [component]
```

The UI workspace currently has **61 shared component files** (including the existing Button and Card). Both CLI routing and the prior Attachment registry entry were verified with the configured `radix-nova` style. See the official [Shadcn monorepo guide](https://ui.shadcn.com/docs/monorepo).
