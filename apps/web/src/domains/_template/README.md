# Domain template

Copy this directory for a new domain, rename it to a kebab-case id, and replace its metadata. A domain owns its `config`, `components`, `hooks`, `services`, `types`, `utils`, and `tools`.

Each independently registered tool gets its own `components`, `config`, `hooks`, `services`, `types`, and `utils` subfolders. Keep domain-only behavior within the domain. Promote code to `shared/` only when more than one domain genuinely reuses it. Finally, add the domain metadata and tool entries to `shared/config/registry.tsx`.
