# Sales Workspace unified theme

The post-login application shell now owns a single scoped visual theme in `src/styles/globals.css` under `.sales-workspace-app`. It standardizes primary/accent color, light/dark surfaces, borders, inputs, focus states, tables, elevation, and shell translucency across all routed application pages.

The Login page is intentionally outside `AppShell` and therefore does not inherit these scoped overrides. No auth/login source file was modified for this theme pass.

`src/shell/AppShell.tsx` carries `data-product-theme="sales-workspace"` as an explicit theme scope marker.

Existing routes, APIs, forms, agent integrations, and feature logic were not changed in this pass.
