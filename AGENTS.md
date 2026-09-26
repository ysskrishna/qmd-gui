# Agent guidelines

## Conventions

- **qmd execution:** `spawn(qmdBin, argv, { shell: false })` only. Free text after `--`. Argument builders live in `src/shared/commands.ts`; previews use `src/shared/shell.ts`.
- **Stack:** Node 22+, Express 5, Vite + React + Tailwind v4 + shadcn in `src/web`. Server in `src/server`. Tests in `tests/`.
- **UI reference:** `qmd-plan/mock-v3.html` in the parent monorepo folder (not shipped in npm).

## Version bumps and releases

When the user asks to **bump the version**, **prepare a release**, or similar:

### 1. Propose a version — do not edit files yet

Read the current version in `package.json` and **every change since the last release tag**.

```bash
git tag -l 'v*' --sort=-v:refname | head -1
git log <last-tag>..HEAD --oneline
git diff <last-tag>..HEAD --stat
git diff <last-tag>..HEAD
git status
git diff
```

Suggest the next **MAJOR.MINOR.PATCH** (semver). Wait for explicit confirmation before changing files.

### 2. After confirmation — update files only

1. **`package.json`** — `"version"`
2. **`package-lock.json`** — matching version fields
3. **`CHANGELOG.md`** — new section; link `https://github.com/ysskrishna/qmd-gui/releases/tag/vX.Y.Z`

Do **not** run `make release`, create tags, or publish unless the user explicitly asks.

### 3. Release sequence (when asked)

```bash
git add package.json package-lock.json CHANGELOG.md
git commit -m "chore: release v0.1.0"
git push origin main
make release TAG=v0.1.0
```

`make release` pushes the tag. Actions create the GitHub Release and publish to npm (OIDC).

## General

- Match existing code style and keep diffs focused.
- Phase checkpoints: `npm run lint && npm run typecheck && npm test && npm run build` should pass before merging a phase.
