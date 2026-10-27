# Preference and data scopes

This document is the ownership contract for Orbit settings and tool data. A value's scope determines who can read it, who may change it, where it is stored, and how long it lasts. Scope is not inferred from a UI label or from a client-supplied identifier; the server derives authenticated ownership from the session.

## Scopes

| Scope      | Owner                                          | Examples                                                                                  | Persistence and access                                                                                                                                             |
| ---------- | ---------------------------------------------- | ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Deployment | The operator/deployer                          | Product branding, auth enabled, idle timeout, allowed identity providers, default roles   | Version-controlled deployment configuration or secret manager. Never writable through the user UI. Secrets are not stored in `orbit.config.json`.                  |
| Workspace  | One Orbit installation/tenant                  | Shared defaults, enabled domains/tools, workspace-wide policy and future shared templates | Server database, keyed by workspace/tenant. Read/write requires a server authorization check and an audit event for administrative changes.                        |
| User       | One account within a workspace                 | Theme, Explorer layout, favorites, pins, recent items, personal dashboard defaults        | User-owned records, keyed by `(workspace_id, user_id)`. A user cannot read or mutate another user's records by changing request parameters.                        |
| Domain     | One user's or workspace's data within a domain | Finance preferences, health settings, domain-level saved views                            | Keyed by owner scope and `domain_id`; domain IDs are validated against the registered catalog. Use workspace ownership only when the data is intentionally shared. |
| Tool       | One user's or workspace's data for a tool      | EMI calculator defaults, Pomodoro settings, saved tool presets                            | Keyed by owner scope plus `(domain_id, tool_id)`. Validate both identifiers and enforce the selected scope on the server.                                          |
| Session    | One authenticated login                        | Opaque session token hash, expiry, last activity, revocation                              | Server-only session table. Browser receives only an HttpOnly, Secure-in-production, SameSite cookie; never put session credentials in localStorage or tool data.   |

## Preferences versus tool data

Preferences describe how the product should be presented or configured; tool data is content users create or process. For example, an Explorer width is a user preference, an admin's default theme is a workspace preference, an EMI default interest rate is a user/tool preference, and a saved loan scenario is user/tool data. Sensitive or regulated content must not be persisted in browser storage without an explicit product and security decision.

A tool must declare the scope and data classification for every persisted field. Tool code may request a preference/data operation through a scoped service; it must not build raw storage keys from a route, accept an owner ID from the client as authorization, or query another tool's namespace. Tool-to-tool data sharing is not implicit: it requires a documented workspace capability and explicit access policy.

## Current implementation boundary

- `orbit.config.json` is deployment configuration. Branding is validated and injected into the frontend at Vite build/start time; auth/session policy is read by the standalone backend. Frontend settings cannot override deployment policy.
- Authentication identities, roles, and sessions live in the backend database. Password hashes and session-token hashes are server-only.
- Existing visual preferences and tool defaults use browser `localStorage`. These are currently device/browser-local; they are not synchronized across devices and must not be described as workspace-shared or treated as sensitive business data.
- Favorites, pins, and recent tools are also browser-local. Their keys are product-namespaced but are not yet account-isolated. Avoid shared/computer sign-in scenarios until per-user namespacing or server persistence is implemented.
- Dynamic database-backed roles and dashboard/domain/tool/feature grants are implemented; see the [RBAC contract](rbac.md). Preference ownership and cross-user data isolation remain separate concerns: authorization to open a tool does not imply permission to read another user's saved data. Hiding a control in React is never an authorization boundary.

## Rules for the next persistence phase

1. Keep the current local adapter behind a typed scope-aware interface; establish the scope contract before changing stored keys.
2. Add account separation using a stable server-issued user ID and workspace ID, not username/display name. Sign-out must not erase another user's stored state.
3. Version preference schemas and migrate old browser keys in a one-time, idempotent migration. Preserve a rollback path and never silently discard unparseable values.
4. Store shared workspace data only through authenticated backend APIs. Every write must authorize the active user and tenant on the server; never trust client-sent role, workspace, user, domain, or tool ownership.
5. Keep secrets and credentials out of preferences, app logs, URLs, toast messages, browser storage, and exported backups unless explicitly designed for that purpose.
6. Define retention/deletion behavior for account removal, workspace offboarding, and tool-data deletion before shipping persisted business data.
7. Add tests for cross-user isolation, cross-workspace isolation, scope validation, migration idempotency, and unauthorized access before enabling remote/shared scopes in the UI.

## Adding a persisted field

For each new field, document: scope; owner; purpose; schema/version; sensitivity; default; retention; whether it syncs; migration; validation; authorization check; export/delete behavior; and tests. If any of these are unknown, keep the value ephemeral until the decision is made.
