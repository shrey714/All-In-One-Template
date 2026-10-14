# Web application

This Vite app owns the dashboard shell and all domain/tool feature code. Shared Shadcn building blocks stay in `packages/ui`.

## Directory convention

```text
src/
├── App.tsx                         # App route composition
├── main.tsx                        # Providers + app mount
├── app/
│   ├── AppShell.tsx                # Global workspace chrome and overlays
│   ├── errors/                     # Route-level errors and recovery UI
│   ├── layouts/ providers/ routes/ # App composition boundaries
│   └── pages/                      # Overview and domain landing pages
├── domains/
│   ├── _template/                  # Copy this for a new domain/tool
│   ├── finance/
│   │   ├── config/ components/ hooks/ services/ types/ utils/
│   │   └── tools/emi-calculator/{components,config,hooks,services,types,utils}
│   ├── productivity/
│   │   ├── config/ components/ hooks/ services/ types/ utils/
│   │   └── tools/pomodoro-timer/{components,config,hooks,services,types,utils}
│   └── health/                     # Registered starter with no fake tools
└── shared/
    ├── components/{layout,dialogs,forms,feedback,data-display,navigation}/
    ├── config/                     # App settings, URL builders, central registry
    ├── constants/ hooks/ lib/ types/ utils/
    └── services/{api,analytics,recent-tools,pinned-tools}/ # Cross-domain service boundaries
```

Use the nearest owner: a tool owns tool-specific implementation; a domain owns shared domain behavior; `shared/` owns genuinely cross-domain logic. Keep feature UI in the web app and reusable Shadcn primitives in `packages/ui`.

## Add a tool

1. Copy `src/domains/_template/tools/_tool-template` to `src/domains/<domain>/tools/<tool-id>`.
2. Implement the component and put its local UI, hooks, service calls, types, and helpers in that tool folder.
3. Add a domain descriptor under `<domain>/config/domain.ts` and register tool metadata/component in `src/shared/config/registry.tsx`.
4. Add automated tests where appropriate. The central route resolves new tools from the registry, so normal tool work does not require editing `App.tsx`.

## Workspace utilities

- Resizable explorer: drag the double-edge separator; press Left/Right to resize and Home/End to move to the limits.
- Activity Rail views: switch the sidebar between Explorer, Pinned, and Recent; domain groups are collapsible.
- Collapse/expand to icon-only navigation for the active view: click the chevron or use `⌘B` / `Ctrl+B`.
- Global command palette: use the single toolbar search control or press `⌘K` / `Ctrl+K`. The sidebar filter only filters the current Explorer/Pinned/Recent view.
- Pinned tools: star a tool in the Explorer or overview; pinned items persist locally, appear on the overview, and can be removed from either view.
- Recent tools: route visits are stored locally and listed in the Recent view; use its trash control to clear the history.
- Settings manager: click the gear or press `⌘,` / `Ctrl+,`; set Light/Dark/System, density, status-bar visibility, and explorer width.
- Shortcut guide: click `?` or press `?` outside an editable field.

## Routes

- `/` — overview
- `/domains/:domainId` — domain overview/empty state
- `/domains/:domainId/tools/:toolId` — tool
- `/domains/:domainId/tools/:toolId/steps/:stepId` — step deep link
- EMI inputs use `?amount=2500000&rate=8.5&years=20`; timer state uses `?step=2&seconds=1500`.

## Shadcn

From this workspace, use the CLI to target the shared UI package:

```bash
npx shadcn@4.21.4 add [component]
```

Use imports such as `@workspace/ui/components/button` in app code.
