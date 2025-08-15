# Changelog (Unreleased)

Use this section to draft release notes for the next version. Copy relevant entries into `CHANGELOG.md` when releasing.

## Presence stacks

- Show stacked avatars for chat participants and polling improvements

## E2E harness

- Force auth in tests and render chat list container even when empty
- Stub critical fetches in e2e mode and expose an app-ready marker
- Run dev server in CI with e2e flag for deterministic navigation
- Stabilize agent not-found and knowledge drawer flows with dedicated test ids
- Wait for explicit app readiness and disable animations to remove e2e flakiness
- Deterministic draft hook and composer lock test ids for Interfere flow

## Chat window

- Gradient status header, functional Interfere/Return controls and Change status menu

## Agent providers

- Pluggable Mock/OpenAI providers with per-chat settings and token usage ledger
- Mock provider streams draft chunks and surfaces `provider_error` events
- Draft bubbles with approve/discard and private visibility
- OpenAI streaming provider with usage events, error codes and abort support

## Agents & Knowledge

- Graceful agent not-found state and Add drawer for knowledge collections
- Redirect invalid agent ids to agent list with friendly toast

## Sidebar

- Themed Trickster brand mark in collapsed sidebar with chevron toggle

## Simulator

- Bootstrap read-only Simulator Studio app on port 5174 under `apps/simulator-studio`
- Seed admin fixtures and expose read-only `/admin` endpoints for plans and users
- Interactive Chat Console with dual-sided messaging and agent draft approve/discard
- Tenant Knowledge Manager with collections/files CRUD, uploads with quota enforcement
- Billing Manager for token credit/debit with ledger history
- Plan Manager to change plans and quotas with enforced token/storage limits
- Tenant-scoped RBAC with login for owner/operator/viewer roles
- Seed demo tenants and reseed endpoint
- Dev impersonation tokens with one-click Open App
- Live chat console with polling and draft approve/discard
- Realtime SSE stream for chats, drafts and presence in Simulator Studio
- Background agent runner generating draft replies with pause/resume controls
- Mock DB persistence scripts (`mock:save`, `mock:reset`, `mock:export`)

## Billing

- Show account plan and token usage with progress bar

## Template

```
## Summary
- Short bullet describing change

## Testing
- `npm test`
- `npm run build`
- `npm run e2e`

## Notes
- Optional extra context

## Files changed (N)
```
