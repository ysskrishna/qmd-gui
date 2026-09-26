# Changelog

All notable changes to `qmd-gui` are documented here.

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),  
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Fixed

- Search page no longer crashes on first load when the default hybrid mode has an empty query (command preview fallback).

## [0.1.0] - 2026-09-26

First public release: local web UI for qmd 2.8+ with search, collections, context, index maintenance, and MCP/skill helpers.

### Added

- Project scaffold: TypeScript, Vite + React, Tailwind CSS v4, Express server, Vitest, ESLint, Prettier, and CI workflows.
- Phase 1 server core: shared `qmd` argv builders, process runner, job queue with SSE, `index.yml` patches with `baseHash`, security (token, Host, CSP, rate limit), and CLI `start` / `stop` / `status` / `--detach`.
- Phase 2 read APIs: qmd 2.8.3 output parsers, `fake-qmd` test harness, and `/api/status`, `/collections`, `/docs`, `/context` (503 when `qmd` is missing).
- Phase 3 web shell: sidebar layout, five page stubs, Activity panel with job SSE, CommandPreview, FirstRun gating, TanStack Query, and light/dark theme.
- Phase 4 search: mode cards, scoped collections, option gating, live CommandPreview, job-backed results, explain table, and document drawer via `qmd get`.
- Phase 5 collections and context: collection table with include toggle and row actions, add-collection dialog (native picker, home dir browser, paste path), detail tabs (files, settings with `planSettings` save pipeline, collection context), `PUT /collections/:name/config`, `POST /pick-folder`, `GET /fs/dirs`, and global/scoped context forms.
- Phase 6 index and agents: maintenance panel (update, embed, pull, cleanup preview gate, doctor output), models and index details from status, MCP HTTP start/stop with port clash warning, stdio snippet, skill install with project cwd validation, and `guiPort` on `/api/system`.
- Phase 7 docs and CI: README, `docs/configuration.md`, Playwright e2e against fake-qmd, and real-qmd API smoke job in CI.

[0.1.0]: https://github.com/ysskrishna/qmd-gui/releases/tag/v0.1.0
