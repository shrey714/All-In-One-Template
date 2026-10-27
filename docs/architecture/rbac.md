# Dynamic role-based access control

Orbit uses a deny-by-default, database-backed grant model. A user may hold multiple assignable roles; effective grants are the union of grants on those roles. A role is a reusable policy bundle, not a hard-coded account type. The frontend uses server-issued role/grant data for navigation and affordances, but the backend remains authoritative on every protected request.

## Access scopes

| Grant                                                 | Meaning                                                                                                                                                  |
| ----------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `dashboard:access`                                    | Required to enter the authenticated workspace. A successful login alone does not grant dashboard access.                                                 |
| `tools:use`                                           | Broad access to all registered tools, subject to tool availability.                                                                                      |
| `domain:<domain-id>:access`                           | Access to tools in one domain.                                                                                                                           |
| `tool:<domain-id>/<tool-id>:access`                   | Access to one specific tool.                                                                                                                             |
| `feature:<domain-id>/<tool-id>/<feature-id>:<action>` | A future or tool-specific action such as `export`, `edit`, or `approve`; a tool's backend must explicitly enforce this grant at the action/API boundary. |
| `users:*`, `roles:*`                                  | Independent account- and role-administration capabilities. See the grant catalog in `backend/src/permissions.ts`.                                        |

Tool access is additive: `tools:use`, a matching domain grant, or a matching tool grant permits navigation, provided the user also has dashboard access. There are currently no explicit deny rules; do not model overrides by removing a grant from one role while another assigned role still grants it.

## Built-in roles

Built-ins are seeded from `backend/src/permissions.ts` and cannot be edited or deleted through the API:

- **System administrator** — protected bootstrap identity with `*`; cannot be assigned, removed, or changed through regular role/user APIs.
- **Dashboard access** — lets a user enter the workspace but does not grant tool access.
- **All tools user** — dashboard and all registered tool access.
- **Access manager** — user and role administration without automatically granting tool access.

Administrators can define additional roles in **Account menu → Access roles**, combining global, domain, tool, and feature/action grants. In **Users & access**, an account can receive multiple roles. Accounts created with no roles can sign in and change their temporary password, but receive no dashboard or tool access.

## Enforcement and safety

- The root route checks `dashboard:access`; domain and tool routes check their matching scopes. The Explorer, pinned/recent lists, home summary, and domain catalog filter to the same server-issued grants.
- Protected API namespaces require an authenticated, active session, completed first-login password rotation, and dashboard access. Each operation then checks its specific users/roles capability.
- Grant evaluation reads current database assignments on every request. Role changes therefore take effect without relying on stale browser state or waiting for a token refresh.
- Grant keys are validated against a strict grammar. Grant assignment is delegated: an actor may assign only roles whose grants are a subset of the actor's current grants, unless the actor is the protected System administrator. An actor cannot edit their own role assignments.
- The protected System administrator cannot be edited/deactivated through ordinary management routes. Authorization mutations are recorded in `authorization_audit`.
- Legacy Admin/Member databases are migrated once: the earliest legacy Admin becomes System administrator, other legacy Admins retain broad tool and access-management grants, and legacy Members retain broad tool access. New accounts are not given implicit roles.
- UI visibility is not security. Any future tool mutation, data API, or sensitive feature must enforce its required grant server-side. Frontend helpers such as `hasFeaturePermission` only improve UX.

## Extension guidance

Use stable, lowercase IDs for domain, tool, and feature identifiers. When adding a sensitive action, define the grant key in that tool's authorization contract and check it in the backend handler immediately before performing the action. Avoid broadening `tools:use` when only one resource or operation should be available. Add integration coverage for anonymous access, missing dashboard grants, cross-domain/tool denial, role changes taking effect, grant-delegation limits, and feature-action denial before exposing the feature.
