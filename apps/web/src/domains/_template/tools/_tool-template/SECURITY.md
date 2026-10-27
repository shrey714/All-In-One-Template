# Tool security and data contract

- **Data scope:** replace with `none`, `device`, `user`, or `workspace`
- **Backend dependency:** replace with `yes` or `no`
- **Sensitive actions:** enumerate stable action IDs, or `none`
- **Tool access grant:** replace the placeholder domain/tool IDs

Document where data is stored, retention, export/deletion behavior, and whether data is shared. These declarations are review metadata, not enforcement. Protected data and sensitive actions must be guarded by server-side grants and covered by API-boundary tests for anonymous, unauthorized, and authorized requests. Never rely on hidden frontend controls.
