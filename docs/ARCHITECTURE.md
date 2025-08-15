# Architecture

## 1. Overview
Trickster is a multi-tenant chat console for managing AI agents and human operators. Key sections of the app include:
- **Chats** and **ChatWindow** for conversations
- **Agents**, **Knowledge**, **Pricing**, and **Settings** areas
Data is persisted to `localStorage['app.state.v2']` while a mock backend under `mock_backend/` provides API endpoints. A separate
Simulator Studio in [`apps/simulator-studio/`](../apps/simulator-studio/) browses tenants, workspaces, agents, billing and integrations. It offers an interactive **Chat Console** for posting messages and handling agent drafts, a tenant **Knowledge Manager** for collections/files CRUD with quota tracking and a **Billing Manager** for token credit/debit with ledger history. A simple dev login enables tenant‑scoped RBAC (`owner` / `operator` / `viewer`) that guards knowledge uploads, billing actions and chat moderation. The Billing section includes a **Plan Manager** to switch plans and edit quotas with ledger audit while the mock API enforces token and storage limits.

## 2. Directory map

### Views
| File | Purpose |
| --- | --- |
| [src/views/ChatsView.vue](../src/views/ChatsView.vue) | Chat list with grouping, filters, search and badges |
| [src/views/ChatWindow.vue](../src/views/ChatWindow.vue) | Active chat window with header actions and drafts |
| [src/views/AgentsView.vue](../src/views/AgentsView.vue) | Manage agents and their settings |
| [src/views/AgentDetailView.vue](../src/views/AgentDetailView.vue) | View agent configuration and knowledge links |
| [src/views/KnowledgeView.vue](../src/views/KnowledgeView.vue) | Knowledge collections and sources |
| [src/views/KnowledgeGroupDetailView.vue](../src/views/KnowledgeGroupDetailView.vue) | Collection detail with sources |
| [src/views/AccountView.vue](../src/views/AccountView.vue) | Account settings and team management |
| [src/views/PricingView.vue](../src/views/PricingView.vue) | Upgrade plans |
| [src/views/DashboardView.vue](../src/views/DashboardView.vue) | Placeholder dashboard |
| [src/views/NotFoundView.vue](../src/views/NotFoundView.vue) | 404 page |

### Components
| File | Purpose |
| --- | --- |
| [src/components/Sidebar.vue](../src/components/Sidebar.vue) | Navigation with collapsed logo and workspace switcher |
| [src/components/WorkspaceSwitcher.vue](../src/components/WorkspaceSwitcher.vue) | Change active workspace |
| [src/components/ActionMenu.vue](../src/components/ActionMenu.vue) | Popover menu for chat actions |
| [src/components/AgentBadge.vue](../src/components/AgentBadge.vue) | Tiny avatar/initials for agent association |
| [src/components/BrandTricksterMark.vue](../src/components/BrandTricksterMark.vue) | Trickster logo wrapper |
| [src/components/ThemeSwitcher.vue](../src/components/ThemeSwitcher.vue) | Theme toggler |
| [src/components/LanguageSwitcher.vue](../src/components/LanguageSwitcher.vue) | Language toggler |
| [src/components/VirtualList.vue](../src/components/VirtualList.vue) | Windowed list renderer |
| [src/components/ConfirmDialog.vue](../src/components/ConfirmDialog.vue) | Modal confirmation dialog |
| [src/components/ToastNotification.vue](../src/components/ToastNotification.vue) | Toast messages |

### Stores
| File | Purpose |
| --- | --- |
| [src/stores/chatStore.js](../src/stores/chatStore.js) | Chat data, SLA timers, assignment and auto-return |
| [src/stores/agentStore.js](../src/stores/agentStore.js) | Agent directory and auto-return settings |
| [src/stores/presenceStore.js](../src/stores/presenceStore.js) | Chat participant presence with polling |
| [src/stores/workspaceStore.js](../src/stores/workspaceStore.js) | Workspaces and selection |
| [src/stores/settingsStore.js](../src/stores/settingsStore.js) | Theme, notifications and SLA minutes |
| [src/stores/knowledgeStore.js](../src/stores/knowledgeStore.js) | Knowledge collections and sources |
| [src/stores/accountStore.js](../src/stores/accountStore.js) | Account and pricing data |
| [src/stores/outboxStore.js](../src/stores/outboxStore.js) | Message retries when offline |
| [src/stores/typingStore.js](../src/stores/typingStore.js) | Typing indicators |
| [src/stores/toastStore.js](../src/stores/toastStore.js) | Toast queue |
| [src/stores/logout.js](../src/stores/logout.js) | Logout orchestrator |
| [src/stores/draftStore.js](../src/stores/draftStore.js) | Draft messages with approve/discard |
| [src/stores/billingStore.js](../src/stores/billingStore.js) | Account plan and token usage |

### API
| File | Purpose |
| --- | --- |
| [src/api/chats.js](../src/api/chats.js) | Chat endpoints including assign, interfere and return |
| [src/api/agents.js](../src/api/agents.js) | Agent CRUD |
| [src/api/knowledge.js](../src/api/knowledge.js) | Knowledge collections and sources |
| [src/api/account.js](../src/api/account.js) | Pricing and upgrade |
| [src/api/drafts.js](../src/api/drafts.js) | Draft message approval |
| [src/api/billing.js](../src/api/billing.js) | Account billing info |
| [src/api/index.js](../src/api/index.js) | Axios-like client wrapper |

### Utils and styles
| File | Purpose |
| --- | --- |
| [src/utils/statusTheme.js](../src/utils/statusTheme.js) | Central status color and gradient map |
| [src/utils/virtual.js](../src/utils/virtual.js) | Virtual list math |
| [src/styles/tokens.css](../src/styles/tokens.css) | Design tokens and theme palettes |
| [src/assets/brand/trickster.svg](../src/assets/brand/trickster.svg) | Theme-aware logo |

### Mock backend
| File | Purpose |
| --- | --- |
| [mock_backend/server.js](../mock_backend/server.js) | Express mock server |
| [mock_backend/db.json](../mock_backend/db.json) | Fixture data for chats, agents and knowledge |

## 3. Key flows
- **Chats list:** groups chats by status, applies filters, displays status dot, SLA chip, presence stacks and agent badge. Search normalizes client name, ID and agent name. Group collapse state saved in `sessionStorage`.
- **Chat window:** header gradient reflects status, shows assignee chip, Interfere/Return buttons and status menu. Draft panel surfaces agent replies awaiting approval. Stacked avatars and typing indicators update live. Offline banner and outbox retries handle connectivity issues.
- **Control model:** each chat has `control` of `agent` or `operator`. Interfere grants operator control, auto‑return schedules warning at T‑60s and return at T using `agentStore.settings.autoReturnMinutes`. Manual‑approve forces agent replies into drafts.
- **Assignment:** operators can claim, unassign or transfer chats. Only the assignee can Interfere; others see a disabled button with tooltip. Assignee chip shows in chat list and header. Chats can be filtered by "Assigned to me".
- **Snooze:** temporarily hides a chat from attention until a timer elapses; unsnooze restores it.
- **Knowledge:** manage collections and sources (URL, upload, Q&A) with indexing status, filters and preview. Agents link to collections via `agentStore.state.knowledgeLinks`.
- **Pricing/Account:** upgrade flow posts to `/account/upgrade` and persists plan.
- **Logout orchestrator:** `logout.js` clears stores, updates presence and redirects.
- **Workspace:** CRUD operations persist to `localStorage`; workspace switcher visible only when `hasMultiple()`.

## 4. State model
```json
// Chat
{
  "id": "string",
  "status": "attention | live | paused | resolved | ended",
  "control": "agent | operator",
  "agentId": "string",
  "assignedTo": { "id": "string", "name": "string", "avatarUrl": "string" } | null,
  "slaStartedAt": "ISO string" | null,
  "slaBreached": boolean,
  "lastOperatorActivityAt": "ISO string" | null,
  "autoReturnAt": "ISO string" | null
}

// Agent
{
  "id": "string",
  "name": "string",
  "avatarUrl": "string",
  "color": "string",
  "manualApprove": boolean,
  "autoReturnMinutes": number,
  "knowledgeLinks": Array
}

// Workspace
{
  "id": "string",
  "name": "string",
  "selected": boolean
}

// Settings
{
  "notificationsEnabled": boolean,
  "workspaceSettings": { "attentionSLA": number },
  "theme": "string",
  "language": "string"
}

// Presence
{
  "operators": [ { "id": "string", "name": "string", "avatarUrl": "string", "online": boolean } ]
}
```
`persist()` is called in `chatStore`, `agentStore`, `settingsStore` and `workspaceStore` to write state to `localStorage`.

## 5. UI theming
- Status colors, gradients and chips derive from [`statusTheme.js`](../src/utils/statusTheme.js).
- Trickster brand mark colour comes from the `--brand-logo` token defined per theme in [`tokens.css`](../src/styles/tokens.css).
- Components respect `prefers-reduced-motion` and provide `aria-label` attributes for timers and badges.

## 6. API (mock)
| Endpoint | Description |
| --- | --- |
| `GET /chats` | List chats |
| `POST /chats/:id/assign` | Claim chat |
| `POST /chats/:id/unassign` | Unassign chat |
| `POST /chats/:id/transfer` | Transfer chat |
| `POST /chats/:id/interfere` | Take control from agent |
| `POST /chats/:id/return` | Return control to agent |
| `POST /chats/:id/snooze` | Snooze chat |
| `POST /chats/:id/unsnooze` | Unsnooze chat |
| `GET /agents` | List agents |
| `GET /operators` | List operators |
| `GET /knowledge*` | Knowledge collections and sources |
| `POST /account/upgrade` | Upgrade pricing plan |
`mock_backend/db.json` seeds the data and `mock_backend/server.js` serves the endpoints.

## 7. Build & test
- `npm run build` builds the app with Vite and runs `scripts/after-build.cjs` to create `dist/404.html`.
- `npm test` runs Vitest suites.
- `npm run e2e` starts the built app and executes Playwright tests; the script exits cleanly if Playwright is not installed.
- GitHub Actions `e2e.yml` pins Node 20, conditionally installs dependencies and attempts Playwright browser install.

## 8. Conventions
- Status values: `attention`, `live`, `paused`, `resolved`, `ended`.
- Toast messages use `toastStore.showToast(message, type)`.
- New i18n keys are added to [`src/i18n.js`](../src/i18n.js) with both `en` and `ru` entries.
- Adding a new theme requires defining `--brand-logo` and any status palette overrides in [`tokens.css`](../src/styles/tokens.css).

## 9. Roadmap (Next)
- Token metering and billing integration
- Analytics dashboards
- Granular permissions and roles
- Per-chat notification muting
- Presence polishing with avatars and counts
