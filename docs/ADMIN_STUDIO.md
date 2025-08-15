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
