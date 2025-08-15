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
- Draft bubbles with approve/discard and private visibility

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
