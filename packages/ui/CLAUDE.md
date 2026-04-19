# packages/ui — CLAUDE.md

Shared UI components library dựa trên shadcn/ui.

## shadcn/ui Components đang dùng

Cài bằng: `pnpm dlx shadcn@latest add <component>`

| Component       | Dùng ở đâu                             |
| --------------- | -------------------------------------- |
| `sidebar`       | DashboardSidebar                       |
| `field`         | LoginForm — thay thế Form cũ           |
| `card`          | PostCard, Analytics, Monitor           |
| `badge`         | ViralityBadge, platform labels, status |
| `button`        | Toàn app                               |
| `input`         | LoginForm                              |
| `label`         | (được wrap bởi FieldLabel)             |
| `toggle-group`  | TagFilterBar — chọn platform/virality  |
| `separator`     | Layout dividers                        |
| `skeleton`      | Loading states                         |
| `sonner`        | Toast notifications                    |
| `chart`         | Analytics — Recharts wrapper           |
| `table`         | Monitor page                           |
| `avatar`        | User avatar trong Sidebar footer       |
| `dropdown-menu` | User menu (sign out)                   |
| `empty`         | Empty states                           |
| `spinner`       | Loading indicator trong stream         |
