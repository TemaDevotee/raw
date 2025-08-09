# AGENTS

Guidelines for contributors and AI agents working on this repository.

## Ground rules
- All commit messages and PR descriptions must be in **English**.
- UI copy and i18n strings must provide both **English and Russian** variants.
- Run `npm test` and `npm run build` before pushing; both must complete successfully.
- Do not change `package-lock.json` or add dependencies unless a task explicitly calls for it.
- Sidebar constraints: the **Trickster logo** appears only when the sidebar is collapsed; the **WorkspaceSwitcher** renders only when there is more than one workspace.
- Keep existing behaviors intact; avoid regressions in SLA timers, assignment logic and auto‑return.
- Never commit secrets, credentials or generated build artifacts.

## Code style
- Use Vue 3 with the `<script setup>` syntax and the Composition API.
- Prefer `computed` properties and composables over watchers and imperative DOM access.
- Keep state inside dedicated stores; avoid global side effects in modules.
- Reference color, radius and shadow tokens from [`src/styles/tokens.css`](src/styles/tokens.css); do not hard‑code values.
- Tests live next to the code they verify in `__tests__` folders.
- Follow the existing ESLint + Prettier configuration; run `npm run lint` before large changes.

## Diff and PR etiquette
- Use short, descriptive commit messages in the imperative mood (e.g. `Add SLA chip`).
- PR descriptions use bullet lists and relative links to files and line numbers.
- Mention tests run and outcomes in the PR description.
- Do not attach screenshots or binary blobs to PR messages.

## Testing
- Unit tests: `npm test` (Vitest).
- End‑to‑end tests: `npm run e2e` (Playwright). The script auto‑skips when Playwright is unavailable.
- When touching stores or business logic add or update tests accordingly.
- CI requires `npm test` and `npm run build` to pass; e2e failures should be investigated but won’t block commits in locked environments.

## Runbook
```bash
npm install            # install deps
npm run dev            # start Vite dev server
npm run build          # produce production bundle
npm test               # run unit tests
npm run e2e            # run Playwright tests (skips if browsers missing)
```

## Branches and commits
- Work on a single commit where practical; avoid rebasing or force-pushing shared history.
- Keep commits focused; separate refactors from feature changes.
- Reference issue or assignment IDs in commit messages when available.

## Documentation
- Update [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) and [`docs/FEATURE_MATRIX.md`](docs/FEATURE_MATRIX.md) when introducing new features.
- Link to documentation sections in PR descriptions when relevant.
- For changelog entries place notes in `docs/CHANGELOG_HEAD.md`.

## Review checklist
- [ ] `npm test` passes
- [ ] `npm run build` succeeds
- [ ] Updated or added tests
- [ ] No stray console logs or TODOs
- [ ] PR description lists affected files and test output

