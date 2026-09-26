# Changelog

All notable changes to `qmd-gui` are documented here.

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),  
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.0.0] - 2026-09-26

First public release. Local web UI for qmd 2.8+.

### Added

- Search with keyword, vector, or hybrid mode, scoped to selected collections, with a live command preview, optional score explanation, and a document drawer.
- Collection list: add a folder with the native picker, a home-directory browser, or a pasted path. Include or exclude a collection from default search, rename it, remove it, and edit its index settings.
- Global context and per-collection context.
- Index status and models, plus update, embed, pull, doctor, and cleanup. Cleanup stays disabled until a dry-run preview succeeds.
- Agents page: start and stop the qmd MCP HTTP server, copy an MCP stdio snippet, and install the qmd skill into a project directory.
- CLI commands `start`, `stop`, and `status`, including `start --detach`.

### Fixed

- Search page no longer crashes on first load when hybrid mode has an empty query.

[1.0.0]: https://github.com/ysskrishna/qmd-gui/releases/tag/v1.0.0
