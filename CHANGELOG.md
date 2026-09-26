# Changelog

All notable changes to `qmd-gui` are documented here.

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),  
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Project scaffold: TypeScript, Vite + React, Tailwind CSS v4, Express server, Vitest, ESLint, Prettier, and CI workflows.
- Phase 1 server core: shared `qmd` argv builders, process runner, job queue with SSE, `index.yml` patches with `baseHash`, security (token, Host, CSP, rate limit), and CLI `start` / `stop` / `status` / `--detach`.
- Phase 2 read APIs: qmd 2.8.3 output parsers, `fake-qmd` test harness, and `/api/status`, `/collections`, `/docs`, `/context` (503 when `qmd` is missing).
