# Productivity domain security

Domain navigation access is governed by the server-issued `domain:productivity:access` grant (or broader dashboard/tool grants). This domain-level file documents route scope only. Data ownership, backend dependencies, and sensitive action grants are declared per tool in each tool folder’s `config/security.ts` and `SECURITY.md`. Backend APIs must enforce grants independently; frontend filtering is not authorization.
