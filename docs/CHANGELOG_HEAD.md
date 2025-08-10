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

## Chat window

- Gradient status header, functional Interfere/Return controls and Change status menu

## Agents & Knowledge

- Graceful agent not-found state and Add drawer for knowledge collections

## Sidebar

- Themed Trickster brand mark in collapsed sidebar with chevron toggle

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
