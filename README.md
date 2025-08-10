# Trickster Front‑end

This repository contains the complete front‑end and mock API server for the **Trickster** application.  The app is built with [Vue 3](https://vuejs.org/), [Vite](https://vitejs.dev/) and a lightweight Express server for development.  It features a polished login screen, multi‑workspace support with delightful micro‑interactions, a premium pricing page and numerous quality improvements.

## For developers

- [AGENTS.md](AGENTS.md) – ground rules for contributors
- [ARCHITECTURE.md](docs/ARCHITECTURE.md) – project structure and key flows
- [FEATURE_MATRIX.md](docs/FEATURE_MATRIX.md) – map of features to files

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

4. **Login** by visiting `/login.html` (served via Vite) and use the following credentials:

   - **Username:** `app`
   - **Password:** `123qweQWE!@#`

   The login form is accessible (keyboard friendly) and shows unobtrusive toasts on validation errors.  Successful authentication sets a session flag in `localStorage` and redirects to the main application.

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

## Simulator Admin

An isolated read-only admin interface lives in [simulator/](simulator/). It runs on port **5174** and connects to the same mock backend.

```bash
cd simulator
npm install
npm run dev
# open http://localhost:5174
```

The app lists users and their workspaces, agents, knowledge collections and chats without mutating data.
