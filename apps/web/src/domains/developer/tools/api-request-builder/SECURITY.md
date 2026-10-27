# api-request-builder security and data contract

- **Current state:** poster-only
- **Data scope:** `none`
- **Backend dependency:** `no`
- **Tool access grant:** `tool:developer/api-request-builder:access` (broader dashboard/domain/global grants may also authorize access)
- **Sensitive actions:** none

This tool currently renders an availability poster only and does not execute a tool workflow or store tool data. Scope is `none` for the current placeholder only; update this contract before enabling functionality.

These declarations are documentation/metadata, not access enforcement. Any future protected data or sensitive operation must be implemented behind an authenticated backend API, checked against a specific server-side grant, and covered by API-boundary tests for anonymous, unauthorized, and authorized requests. Never rely on hidden frontend controls.
