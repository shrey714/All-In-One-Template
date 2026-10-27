# emi-calculator security and data contract

- **Current state:** implemented
- **Data scope:** `device`
- **Backend dependency:** `no`
- **Tool access grant:** `tool:finance/emi-calculator:access` (broader dashboard/domain/global grants may also authorize access)
- **Sensitive actions:** none

Currently implemented and keeps preferences/session state in browser-local storage or URL state; no backend service or sensitive server action is registered. Review the concrete storage call sites before changing this declaration.

These declarations are documentation/metadata, not access enforcement. Any future protected data or sensitive operation must be implemented behind an authenticated backend API, checked against a specific server-side grant, and covered by API-boundary tests for anonymous, unauthorized, and authorized requests. Never rely on hidden frontend controls.
