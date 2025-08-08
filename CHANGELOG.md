# Changelog

## Unreleased

### Features

- **Polished login screen** — modern card design with balanced spacing, accessible inputs (min‑height 44 px), password visibility toggle and unobtrusive validation toasts.  Supports Enter‑to‑submit and disables the button during authentication.
- **Multi‑workspace system** — first login automatically creates a non‑deletable default workspace.  Additional workspaces can be created, renamed and deleted (with confirmations).  Each workspace isolates Chats, Teams and Connections while Bots and Knowledge are shared.  The current workspace persists via `localStorage` and syncs with the mock API.
- **Workspace switcher micro‑interactions** — when multiple workspaces exist the sidebar shows a switcher beneath the navigation.  Clicking it causes the trigger to rise and scale gently, revealing a sheet listing all workspaces.  The list is keyboard accessible (Arrow keys, Home/End, Enter, Esc) and supports type‑ahead selection.  The Account → Team Management section always shows the switcher and an **Add workspace** button.
- **Premium pricing plans** — new `Account → Plan` view displays elegant pricing cards converted from the original React component.  Cards animate on hover and scroll, support light/dark themes and call `/api/account/upgrade` to persist the selected plan.  The active plan is visibly highlighted.
- **Modular mock API** — the Express server is split into cohesive route modules (`account`, `workspaces`, `chats`, `teams`, `connections`).  A shared `utils/db.js` provides read/write helpers and workspace scaffolding (`ensureScopes`).  Static assets are served with correct MIME types to resolve module loader errors.
- **Centralised API client** — a lightweight `fetch`‑based client attaches the current workspaceId to scoped requests, handles errors with toasts and exposes a familiar axios‑like interface.  Unit tests verify that the workspaceId is correctly applied.
- **ESLint + Prettier** — configured with sensible defaults and integrated into the npm scripts.  Additional rules were disabled to focus on critical errors while maintaining a clean codebase.
- **Unit tests** — Vitest covers workspace store operations (create/switch/delete) and API client behaviour.
- **Documentation** — updated README explains setup, features and how to reset state.  CHANGELOG summarises grouped changes.

### Fixes

- **Module MIME error** — corrected MIME types for `.js`, `.mjs` and source map files when serving from Express.  Prevents the browser from treating modules as HTML.
- **Dead code removal & restructure** — removed unused code, normalised aliases (`@` → `src`), ensured a single entry point (`src/main.js`) and organised routes and utils in both front‑end and back‑end.

### UX/Styling

- Unified radii, spacing and typography across the app.  Buttons have consistent primary/secondary/ghost variants with accessible hover/focus styles and no over‑bold fonts.
- Sidebar collapse/expand transitions and off‑canvas behaviour on mobile remain smooth and respect `prefers‑reduced‑motion`.
- Pricing cards and workspace switcher respect reduced motion preferences by disabling non‑essential animations.

### DevOps

- Added npm scripts for `lint`, `lint:fix`, `format`, `test`, `dev`, `build` and `preview`.
- Added `.eslintignore` to exclude the `dist` folder and `node_modules` from linting.
