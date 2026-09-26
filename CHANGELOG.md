# Changelog

All notable changes to `qmd-gui` are documented here.

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),  
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Project scaffold: TypeScript, Vite + React, Tailwind CSS v4, Express server, Vitest, ESLint, Prettier, and CI workflows.
- Phase 1 server core: shared `qmd` argv builders, process runner, job queue with SSE, `index.yml` patches with `baseHash`, security (token, Host, CSP, rate limit), and CLI `start` / `stop` / `status` / `--detach`.
- Phase 2 read APIs: qmd 2.8.3 output parsers, `fake-qmd` test harness, and `/api/status`, `/collections`, `/docs`, `/context` (503 when `qmd` is missing).
- Phase 3 web shell: sidebar layout, five page stubs, Activity panel with job SSE, CommandPreview, FirstRun gating, TanStack Query, and light/dark theme.
- Phase 4 search: mode cards, scoped collections, option gating, live CommandPreview, job-backed results, explain table, and document drawer via `qmd get`.
- Phase 5 collections and context: collection table with include toggle and row actions, add-collection dialog (native picker, home dir browser, paste path), detail tabs (files, settings with `planSettings` save pipeline, collection context), `PUT /collections/:name/config`, `POST /pick-folder`, `GET /fs/dirs`, and global/scoped context forms.
