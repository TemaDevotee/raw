# Simulator Studio

## Demo tenants

Seed data includes three tenants: `acme` (FREE), `globex` (PRO) and `initech` (TEAM). Each comes with users, agents, knowledge files and chats.

To reseed during development:

```bash
curl -X POST -H "X-Admin-Key: dev-admin-key" http://localhost:5173/admin/dev/seed/reset
```

## Open App as Tenant

For quick impersonation in dev mode enable `DEV_IMPERSONATE=1` and use the **Open App** button in Studio. It issues a short‑lived token and opens the main app as the selected tenant.

Manual cURL:

```bash
curl -X POST -H "X-Admin-Key: $ADMIN_KEY" \
     -H "Content-Type: application/json" \
     -d '{"tenantId":"acme"}' \
     $BASE/admin/auth/impersonate
```

## Chat Console

The Chat Console lists chats for a tenant and lets you converse as the client or agent. Draft messages appear in gray until approved or discarded. Use the **Open in App** button to view the same chat in the main UI.

### Agent runner

The console exposes an **Agent** panel with:

- **Generate draft / Сгенерировать драфт** — ask the mock LLM to propose a reply.
- **Abort / Прервать** — stop the current generation.
- **Pause / Пауза** and **Resume / Возобновить** — control automatic draft generation.
- Typing indicator while the agent is composing.
- **Agent Settings / Настройки агента** — choose provider (Mock or OpenAI), model, edit system prompt, temperature and max tokens. Save changes per chat.

After each run a usage line shows `{inputTokens, outputTokens, totalTokens}`; estimated counts are marked accordingly.

If token quota runs out the console shows a warning and disables **Generate draft** until more tokens are credited in Billing. Provider failures emit `provider_error` events; the banner disappears after a new attempt.

## Realtime (SSE)

Studio listens for chat events via a Server‑Sent Events stream when `ADMIN_SSE=1` (default). The backend requires both `X-Admin-Key` and a tenant token; in dev the studio passes them as query params. Heartbeats (`ADMIN_SSE_HEARTBEAT_MS`, default 20000 ms) keep the connection alive and `ADMIN_SSE_CONN_LIMIT` caps simultaneous streams per token. If SSE is disabled or unsupported the Studio falls back to polling every few seconds and the header indicator turns yellow or red.

The stream emits:

- `agent:state` – `typing` or `idle` while the provider works
- `draft:chunk` – incremental text of the draft being generated
- `provider_error` – upstream failure; the message is shown as a toast

## RBAC

Enable login with `DEV_LOGIN=1` (backend) and `VITE_DEV_LOGIN=1` (studio). Demo accounts:

- owner@{tenant}.demo
- op@{tenant}.demo
- view@{tenant}.demo

Password: `demo123!`

| Action / Действие              | owner | operator | viewer |
| ----------------------------- | ----- | -------- | ------ |
| View data / Просмотр          | ✅     | ✅        | ✅      |
| Send messages / Отправка сообщений | ✅ | ✅ | ⛔ |
| Approve/discard drafts / Модерация | ✅ | ✅ | ⛔ |
| Upload/delete files / Файлы   | ✅     | ✅        | ⛔      |
| Change plan or quotas / Смена плана и квот | ✅ | ⛔ | ⛔ |
| Credit/debit tokens / Начисления | ✅ | ⛔ | ⛔ |
| Reset period / Сброс периода | ✅ | ⛔ | ⛔ |
