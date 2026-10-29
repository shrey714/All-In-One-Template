# Persistent notification Inbox

Orbit's Inbox complements Sileo. Sileo remains the immediate, transient feedback path for actions performed in the current screen; the Inbox is the durable, per-account stream for updates that may need later attention. Use the Inbox for events such as completed exports, approvals, scheduled jobs, or relevant workspace changes—not routine field validation or every toast.

## Availability and configuration

The feature is enabled by default in the repository-root `orbit.config.json`:

```json
{
  "notifications": {
    "enabled": true
  }
}
```

Set `enabled` to `false` to hide the Activity Rail entry and return 404 from `/api/notifications`. The Inbox requires authentication and a completed password-change flow. It also requires `dashboard:access`; it does not grant any tool access. The frontend embeds the config during Vite startup/build and the backend reads it at startup. Keep them on the same config and restart/rebuild after changes.

## User experience

The desktop Activity Rail has an Inbox view and a badge for the current account's unread count. The expanded sidebar provides All, Unread, Priority, and Archived filters, reverse-chronological pages, read/unread actions, mark-all-read, archive/restore, relative source identity, timestamp, and an optional route deep link. The collapsed rail/sidebar continues to expose the Inbox and unread count. The Inbox reloads on focus and visibility restoration and refreshes every 30 seconds while the page is visible. The first page is bounded to 30 records; callers may request 1–50 per page.

Deep links are same-origin root-relative application paths only; external, protocol-relative, backslash/control-character, and overlong URLs are rejected by the backend producer helper. They are rendered with the React Router `Link` rather than an arbitrary HTML fragment. Validate destinations at the point of message creation and avoid placing credentials or sensitive data in paths or query strings.

## Server-side producer contract

There is intentionally no browser-facing notification-create endpoint. A tool backend should create a message only from a trusted server operation, after its existing session, tool/feature grant, and resource-ownership checks. Import `createPersistentNotification` from `backend/src/notifications-store.ts` and pass the recipient ID from the authenticated server session or a verified server-side event—not from request body, query, or client-controlled headers.

```ts
createPersistentNotification(database, {
  recipientUserId: authenticatedUser.id,
  title: "Export is ready",
  body: "Your monthly report is available.",
  priority: false,
  href: "/domains/finance/tools/monthly-report?tab=exports",
  sourceDomainId: "finance",
  sourceToolId: "monthly-report",
})
```

Title length is 1–120 characters, body length is up to 1000 characters, and both are plain text. Source IDs use lowercase kebab-case. A source tool requires a source domain. Recipients must be active users. Priority is a boolean; applications should reserve it for attention-worthy events. The helper is server code and does not replace the caller's authorization check.

## API contract

All routes require a valid, non-expired session and `dashboard:access`. The user ID is resolved exclusively from the session. Writes also pass the API's same-origin guard, and API responses are marked `no-store`.

| Method and path                                                    | Purpose                                                       |
| ------------------------------------------------------------------ | ------------------------------------------------------------- |
| `GET /api/notifications?filter=all                                 | unread                                                        | priority | archived&limit=30&cursor=<id>` | Return one page, unread count, `hasMore`, and an opaque-to-client numeric ID cursor. |
| `PATCH /api/notifications/:id/read` with `{ "read": true }`        | Mark one owned notification read or unread.                   |
| `POST /api/notifications/read-all`                                 | Mark all of the current user's unarchived notifications read. |
| `PATCH /api/notifications/:id/archive` with `{ "archived": true }` | Archive or restore one owned notification.                    |

List results contain `id`, `title`, `body`, `priority`, `href`, `sourceDomainId`, `sourceToolId`, `createdAt`, `readAt`, and `archivedAt`. Unknown or other-account IDs return 404, avoiding disclosure that another user's record exists. Invalid filters, cursors, limits, or mutation bodies return 400. Anonymous sessions receive 401; a signed-in user without dashboard access receives 403.

## Storage and operations

SQLite stores notifications in `user_notifications`, indexed by recipient and descending ID, with a foreign key that removes a user's notifications if that user is eventually deleted. Read, unread, and archive timestamps are server-generated. There is no client-side persistence or cross-account cache. The current release does not implement email/push delivery, snoozing, configurable retention, bulk deletion, or a notification-preferences UI. Define product retention and backup policy before deploying high-volume producers; avoid generating a record for every low-value event.

## Validation

### Try it in the local UI

1. Confirm `notifications.enabled` and `auth.enabled` are both `true`, then start/restart the local backend and web dev server (`npm run dev --prefix backend` and `npm run dev --workspace=web`). Sign in to the local Orbit instance with an active account.
2. From the repository root, create a sample notification for that exact account username:

   ```bash
   npm run notification:test --prefix backend -- <your-username>
   ```

   The command is development-only, uses the real backend producer helper, and refuses to run with `NODE_ENV=production`. It creates one priority notification with an in-app Finance link; repeat it to generate additional samples.

3. Click **Inbox** in the Activity Rail. Check that the unread badge appears, select **Priority**, open the notification to follow its deep link, and then return to Inbox to mark another item read or archive it. Verify the unread badge decreases; select **Archived** and restore an item to return it to the inbox.
4. To check account isolation, run the command once for a second active username and sign into each account in turn. Each should see only the message addressed to that account.

The sample entries are ordinary Inbox rows stored in the local SQLite database; archive or read them in the UI, or delete them using a local database reset if you want a clean slate. Never run a copy of the CLI with a production database: production mode is blocked intentionally.

The backend integration suite covers anonymous rejection, account isolation, pagination, unread/priority/archived filters, read/archive/restore transitions, invalid cursors, same-origin link constraints, and the disabled feature flag. Run:

```bash
npm run lint --prefix backend
npm run typecheck --prefix backend
npm test --prefix backend
npm run lint --workspace=web
npm run typecheck --workspace=web
npm run build --workspace=web
```

When adding a tool producer, also test its event trigger, recipient selection, source link, and duplicate/retry behavior. Do not treat Inbox persistence as a substitute for authorization audit records.
