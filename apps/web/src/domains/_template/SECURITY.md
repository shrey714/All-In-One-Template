# Domain security contract

Domain navigation access is governed by a server-issued domain grant (or broader dashboard/tool grants). This file documents route scope only. Data ownership, backend dependencies, and sensitive action grants belong in each tool folder's `config/security.ts` and `SECURITY.md`.

Backend APIs must enforce grants independently; frontend filtering is not authorization. When a tool handles protected data or sensitive actions, add API-boundary tests for anonymous, unauthorized, and authorized requests.
