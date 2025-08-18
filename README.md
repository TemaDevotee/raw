# Trickster Front‑end

This repository contains the complete front‑end and mock API server for the **Trickster** application.  The app is built with [Vue 3](https://vuejs.org/), [Vite](https://vitejs.dev/) and a lightweight Express server for development.  It features a polished login screen, multi‑workspace support with delightful micro‑interactions, a premium pricing page and numerous quality improvements.

## Локальный запуск (мок-режим)

1. Скопируйте переменные окружения: `cp .env.example .env` (Windows: `copy .env.example .env`).
2. Установите зависимости: `npm install`.
3. Запустите все сервисы:
   - macOS/Linux: `APP_PORT=5173 STUDIO_PORT=5199 npm run dev:all`
   - Windows (CMD/PowerShell): `npm run dev:all`
4. Откройте в браузере:
   - Main app — http://localhost:5173/
   - Simulator Studio — http://localhost:5199/login
   - Mock backend — http://localhost:3001/

5. Войдите одной из демо‑учёток:

   - `alpha / Alpha123!`
   - `bravo / Bravo123!`
   - `charlie / Charlie123!`

   или откройте `/login?skipAuth=1` для быстрого входа без пароля.

If `npm install` fails with a 403 error, reset the npm registry:

```bash
npm config set registry https://registry.npmjs.org/
npm cache clean --force
```
## For developers

- [AGENTS.md](AGENTS.md) – ground rules for contributors
- [ARCHITECTURE.md](docs/ARCHITECTURE.md) – project structure and key flows
- [FEATURE_MATRIX.md](docs/FEATURE_MATRIX.md) – map of features to files
- [AGENT_PROVIDERS.md](docs/AGENT_PROVIDERS.md) – configuring agent providers and quotas
- [ADMIN_STUDIO.md](docs/ADMIN_STUDIO.md) – running the Simulator Studio and editing per‑chat Agent Settings

## Getting started

1. **Install dependencies** for both the front‑end and the mock back‑end:

   ```bash
   # from the project root
   cd project/get.3xtr.im-main
   npm install
   # install back‑end deps
   (cd mock_backend && npm install)
   ```

2. **Start the mock API server** in one terminal:

   ```bash
   cd project/get.3xtr.im-main/mock_backend
   npm start
   # server runs at http://localhost:3001
   ```

3. **Start the front‑end dev server** in another terminal:

   ```bash
  cd project/get.3xtr.im-main
  npm run dev
  # Vite will serve the app at http://localhost:5173
  ```

### Agent provider environment

Set the following variables to enable the OpenAI provider and control timeouts:

```
OPENAI_API_KEY=...
OPENAI_BASE_URL=https://api.openai.com
OPENAI_MODEL_DEFAULT=gpt-4o-mini
PROVIDER_TIMEOUT_MS=60000
```

4. **Login** by visiting `/login.html` (served via Vite) and use the following credentials:

   - **Username:** `app`
   - **Password:** `123qweQWE!@#`

   The login form is accessible (keyboard friendly) and shows unobtrusive toasts on validation errors.  Successful authentication sets a session flag in `localStorage` and redirects to the main application.

## Quick login bypass (Быстрый вход без логина)

- [http://localhost:5173/#/?skipAuth=1](http://localhost:5173/#/?skipAuth=1) — skip the login screen once.
- Create a `.env.local` with `VITE_E2E=1` and restart the dev server to stay logged in.
- Common pitfall: opening `/login.html` directly. Use the hash route (`/#/`) or append `?skipAuth=1`.

## Mock DB utilities

The mock back‑end stores its data in `mock_backend/db.json`. Helper scripts mirror the current state to the
`.mockdb/` directory so it can be reset or archived.

```bash
npm run mock:save   # copy db.json to .mockdb/db.json
npm run mock:reset  # restore db.json from backup and save
npm run mock:export # snapshot to .mockdb/exports/
npm run mock:snapshot:list   # list available snapshots
npm run mock:snapshot:load -- <name> # load snapshot into current
```

## Production build

To produce a production build of the front‑end, run:

```bash
cd project/get.3xtr.im-main
npm run build
```

The compiled files will appear in the `dist/` folder.  After building, you can preview the production build with `npm run preview`.  The mock back‑end can still be run from `mock_backend`.

## Workspaces

Workspaces let you organise chats, teams and connections into separate contexts.  Bots and Knowledge items are shared across all workspaces.

- **Default workspace:** On first login a default workspace is automatically created.  It cannot be deleted but can be renamed.
- **Sidebar switcher:** When there is more than one workspace the sidebar displays a switcher below the navigation list.  Clicking it gently lifts the button and reveals a sheet listing all workspaces.  The list is fully keyboard navigable (Up/Down/Home/End/Enter/Esc) and closes on outside click or Esc.  When only one workspace exists the switcher is hidden.
- **Account page:** The Account → Team Management section always shows the workspace switcher along with an **Add workspace** button beneath it.  Creating or deleting a workspace asks for confirmation (in Russian by default) and updates the current workspace accordingly.
- **Data persistence:** The client state is stored in `localStorage` under the key `app.state.v2` and synchronised with the mock back‑end.  Clearing this key resets your local state.

## Pricing plans

Navigate to **Account → Plan** to view the premium pricing cards.  Cards have a multi‑layer shadow, graceful hover/scroll animations and support for light/dark themes.  Selecting a plan sends a request to `/api/account/upgrade`, persists the plan in the mock back‑end and visually marks the active plan.  A toast notifies you on success.

## API client

All network requests go through a centralised API client (`src/api/index.js`) which automatically attaches the current workspace identifier to scoped resources (`/chats`, `/teams`, `/connections`).  The client surfaces backend errors via toasts and exposes `get`, `post`, `patch` and `delete` methods similar to axios.  See `src/api/__tests__/apiClient.test.js` for examples.

## Running tests & lint

Unit tests are written with [Vitest](https://vitest.dev/) and cover critical logic such as workspace creation/switching and API client behaviour.  ESLint with Prettier ensures a consistent code style.

```bash
cd project/get.3xtr.im-main
# run linter
npm run lint
# run unit tests
npm test
```

## End-to-End tests

Playwright tests provide a small smoke suite that runs against the built application.

```bash
# run once to build the app
npm run build

# execute the headless suite
npm run e2e

# debug with UI or headed browsers
npm run e2e:ui
npm run e2e:headed

# open the last HTML report
npm run e2e:report
```

On install the required browsers are downloaded automatically; no manual `npx playwright install` step is needed.

## Resetting state

If you wish to start from scratch, stop the dev servers and delete `localStorage['app.state.v2']` in your browser.  You can also reset the mock database by replacing `mock_backend/db.json` with `mock_backend/db.json.backup`.

## Screenshots & demos

The `docs/` folder (not provided here) should contain screenshots and GIFs demonstrating the login flow, workspace creation and switching, and pricing plan upgrade.  Please refer to those assets for a visual tour of the application.

## Simulator Studio

A dedicated admin interface lives in [apps/simulator-studio](apps/simulator-studio) and runs on port **5199**.
The mock backend seeds three demo tenants: `acme` (FREE), `globex` (PRO) and `initech` (TEAM).
Use the **Open App** button on a tenant to launch the main app as that tenant via a short-lived impersonation token.
See [docs/ADMIN_STUDIO.md](docs/ADMIN_STUDIO.md) for details.

### Local setup

1. `cp .env.example .env`
   - `VITE_API_BASE=http://localhost:5173`
   - `VITE_ADMIN_KEY=dev-admin`
2. `npm install`
3. `npm run dev` – main app on **5173**
4. `npm run admin:dev` – Studio on **5199**
5. Mock DB panel offers:
   - Autosave toggle
   - Save / Load snapshot
   - Reset
   - Export

If Studio requests return **401/403**, ensure the mock backend
allows CORS from `http://localhost:5199` and that `X-Admin-Key`
matches `VITE_ADMIN_KEY`.

The Chat Console lets you talk to yourself: left side as client, right side as agent/operator. Grey bubbles are agent drafts; approve publishes, discard removes. Role affects abilities: viewers see read-only, operators and owners can send and moderate.

Open it via **Tenants → Chats → Open Console** or start a new chat with **New Chat**. The same chat can be viewed in the main app at `http://localhost:5173/#/chats/<chatId>?skipAuth=1`.

### Knowledge Manager

The **Knowledge** tab lets you manage tenant files:

- create collections,
- upload / download / delete files,
- monitor used vs quota with a progress bar.

Files are stored on disk under `mock_storage/{tenantId}/{collectionId}/`.

### Plan Manager

The **Billing** tab now allows changing tenant plans and adjusting quotas. Use the dropdown to switch between `FREE`, `PRO`, `TEAM` and `ENTERPRISE` plans or enter custom `tokenQuota` and `storageQuotaMB`. All changes are recorded in the billing ledger. Quota errors return HTTP `402` for tokens and `403/413` for storage.

Examples:

```
curl -H 'X-Admin-Key: dev-admin' \
  'http://localhost:5173/admin/knowledge?tenantId=t1'

curl -H 'X-Admin-Key: dev-admin' \
  -F file=@README.md \
  http://localhost:5173/admin/knowledge/collections/<collectionId>/files
```

Increase a tenant's storage quota through existing billing endpoints.

### Billing Manager

The **Billing** tab shows token and storage usage and lets you adjust the
token balance or reset the period. Actions create ledger entries that can be
inspected below the summary.

Examples:

```
curl -H 'X-Admin-Key: dev-admin-key' \
  -H 'Idempotency-Key: 123' \
  -d '{"tenantId":"t1","amount":100,"reason":"bonus"}' \
  -H 'Content-Type: application/json' \
  http://localhost:5173/admin/billing/tokens/credit

curl -H 'X-Admin-Key: dev-admin-key' \
  'http://localhost:5173/admin/billing/ledger?tenantId=t1'
```

## Knowledge (mock storage)

The mock backend persists uploaded knowledge files on disk under `mock_storage/`.
Supported types: pdf, txt, md, docx, xlsx, csv, png, jpg up to 20 MB each.

```
GET  /admin/knowledge?tenantId=t1
POST /admin/knowledge/collections
POST /admin/knowledge/collections/:id/files   # multipart field "file"
GET  /admin/knowledge/collections/:id/files
```

Storage usage and quota are exposed via `/admin/knowledge` response (`storageUsedMB` / `storageQuotaMB`).
