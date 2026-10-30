# Outbound webhooks and live tool presence

Orbit provides two separate server capabilities for extensions:

1. **Outbound webhooks** let trusted backend tool handlers publish versioned-by-convention events to operator-configured HTTPS endpoints. Delivery is signed and retried through a SQLite outbox.
2. **Live tool presence** lets authenticated users see which teammates currently have the same tool open. The browser sends short-lived per-tab leases; the server derives identity from the session and applies current RBAC on both write and read.

Presence is not implemented by sending webhook events to every browser. It is a small authenticated API because the UI needs timely, account-aware state. The webhook outbox is for external server-to-server integrations.

## Feature switches

The repository-root `orbit.config.json` contains:

```json
{
  "presence": { "enabled": true },
  "webhooks": { "enabled": false }
}
```

Presence requires authentication; the `/api/config` endpoint reports it disabled if authentication is disabled. Turning either feature off makes its route unavailable. Frontend and backend read the same root file, but at different times: restart Vite/rebuild the frontend and restart the backend after changing flags. Webhooks default off and also need at least one server-only subscription configuration before any events are queued.

No webhook URL, subscription list, or signing secret is injected into the browser. The public runtime config reveals only the enabled boolean.

## Configure an outbound endpoint

Subscriptions are supplied by the backend process environment, not the frontend config and not an admin/browser API. Example:

```bash
export ORBIT_WEBHOOK_SUBSCRIPTIONS='[{"id":"finance-ops","url":"https://hooks.example.com/orbit/events","secretEnv":"ORBIT_WEBHOOK_SECRET_FINANCE_OPS","events":["finance.report.ready","finance.export.failed"]}]'
export ORBIT_WEBHOOK_SECRET_FINANCE_OPS="$(openssl rand -hex 32)"
```

Set `webhooks.enabled` to `true` in `orbit.config.json` and restart the backend. The endpoint secret must be at least 32 characters. Keep it in the deployment secret manager/environment; never place it in `orbit.config.json`, frontend variables, source control, a request, or a URL. Rotating a secret requires restarting the backend. The subscription parser rejects malformed configuration at startup.

Each subscription has an ID, a fixed HTTPS URL, the name of a secret environment variable, and an allowlist of event type strings (or `"*"`). Orbit limits configuration to 50 endpoints. URLs with credentials, query strings, fragments, IP literals, localhost, `.localhost`, and `.local` hosts are rejected. Use an endpoint you control and enforce outbound network egress policy at the deployment boundary as well; DNS-based private-network protections are not a substitute for egress controls. Redirects are disabled.

The backend sends the exact JSON request body with these headers:

```text
X-Orbit-Event: finance.report.ready
X-Orbit-Delivery: <event-id>:<subscription-id>
Idempotency-Key: <event-id>:<subscription-id>
X-Orbit-Timestamp: <unix-seconds>
X-Orbit-Signature: sha256=<hex HMAC-SHA256(secret, timestamp + "." + rawBody)>
```

Receivers should read the **raw body**, validate the timestamp within a short tolerance (commonly five minutes), compute the same HMAC, compare signatures in constant time, and durably deduplicate on `Idempotency-Key`. Do not deserialize and reserialize before verifying the signature.

### Publish from a protected backend tool handler

Use the shared server helper only after the handler has completed its own authentication, tool/action permission, and input validation. When changing data in Orbit's SQLite database, enqueue inside the same `database.transaction` as the business write; the helper uses a nested savepoint, so both the data change and event roll back together. For an external side effect that cannot share this transaction, enqueue after confirmed success and make the operation itself idempotent. It returns the number of subscription deliveries enqueued (zero when disabled or no subscriptions match):

```ts
import { publishWebhookEvent } from "../../../webhooks.js"

publishWebhookEvent(request, {
  type: "finance.report.ready",
  idempotencyKey: `report:${report.id}:ready:v1`,
  domainId: "finance",
  toolId: "report-center",
  data: {
    reportId: report.id,
    rowCount: report.rowCount,
  },
})
```

The helper generates an event ID and occurrence timestamp unless a stable `idempotencyKey` is supplied; re-publishing the same key to the same endpoint is deduplicated by SQLite. Include a version or operation identifier in the key when a resource can produce multiple distinct events of the same type. `data` must be a plain JSON object; payloads are bounded to 24 KiB. Include only fields the receiver needs. Do not send credentials, session cookies, full user records, payment secrets, or data the endpoint is not authorized to receive. Notification Inbox messages and webhook events are separate: use the Inbox for durable user-facing updates, and webhooks for trusted external integrations.

### Outbox behavior and limits

Accepted events are written to SQLite with one delivery row per matching endpoint. The database stores the fixed endpoint URL, a secret environment-variable **name** (not its value), and the event body so delivery survives a backend restart. A backend worker polls the outbox, signs each attempt, refuses redirects, applies a five-second request timeout, and retries network errors, HTTP 408/429, and server errors with exponential backoff. Permanent ordinary 4xx responses fail immediately. There are at most six attempts; terminal rows are retained for 30 days. If an endpoint URL or secret-variable reference changes between enqueue and delivery, the old queued item fails closed rather than being sent under a mismatched configuration.

This first version is an **outbound** integration foundation; it has no subscription-management UI, delivery administration API, replay UI, or inbound-webhook receiver. Manage endpoint configuration and secrets through deployment operations. Add monitoring/alerting around failed outbox rows before making webhooks business-critical. Endpoint delivery is at-least-once: consumers must be idempotent.

## Live tool presence

When an authenticated user opens a registered tool, the workbench creates a cryptographically random in-memory ID for that browser tab and sends a heartbeat every 20 seconds while visible. A heartbeat is aborted after 10 seconds if the API does not respond. The heartbeat response includes the current active-user snapshot, avoiding a second polling request. Navigating away, hiding, or closing the page attempts an immediate keepalive leave; a tab that crashes or loses connectivity expires automatically after 60 seconds without a heartbeat. A reload may briefly leave an old lease until expiry. Multiple tabs for one account count as one displayed person; leaving one tab does not remove the others. To bound per-account storage and abuse, at most 20 active tab leases are accepted per account; refreshing existing tabs still works at the limit, and a new tab receives a clear retry/close-another-tab message until a lease expires or is removed.

The workbench toolbar previews up to three users as compact Shadcn avatars (initials, since Orbit does not store profile photos) and shows `+N` when more are active. Clicking the group opens the complete active-user list, including a marker for the current account. On network or authorization failure, stale avatars are cleared rather than presented as current.

The service routes are:

```text
POST   /api/presence/:domainId/:toolId/heartbeat   { "clientId": "<UUID>" } → active-user snapshot
DELETE /api/presence/:domainId/:toolId/heartbeat   { "clientId": "<UUID>" }
GET    /api/presence/:domainId/:toolId
```

Every route requires a valid same-origin authenticated session, `dashboard:access`, and an applicable current grant for the requested tool. Heartbeats use the session-derived user ID; a browser cannot nominate another user. Reads re-check the current grants of visible participants, and only active accounts that still hold dashboard and tool access are returned. The response contains display name and a `isYou` marker; it does not include emails, roles, tool state, or activity history. Presence is intentionally ephemeral and has no user-facing history/export.

A running browser in another window can verify the experience: sign in as two provisioned accounts that both have dashboard and Finance → EMI Calculator access, open that tool in each, and look at the avatars in the workbench toolbar. Each signed-in user should see both display names; click the avatars or `+N` to open the full list. A user without the tool grant receives 403 from the API and is not shown. To verify expiry, close one browser process without logging out and wait just over 60 seconds. The integration test also exercises two-user visibility, denial, per-tab leave, de-duplication, heartbeat snapshots, invalid IDs, concurrent tab-cap enforcement, and stale cleanup.

## Validation

```bash
npm run lint --prefix backend
npm run typecheck --prefix backend
npm test --prefix backend
npm run lint --workspace=web
npm run typecheck --workspace=web
npm run build --workspace=web
```

Backend tests validate actual session/grant middleware on presence routes and use a fake HTTP transport for webhook signatures/retries; the fake transport does not contact external services.
