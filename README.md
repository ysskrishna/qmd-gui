# qmd-gui

Local web UI for the [qmd](https://github.com/tobilu/qmd) CLI — search your markdown collections, manage context, and run index maintenance without memorizing every flag.

> **Status:** early development (`0.0.0`). Not ready for production use yet.

## Requirements

- **Node.js** 22 or newer
- **[qmd](https://www.npmjs.com/package/@tobilu/qmd)** 2.8+ installed globally (`npm install -g @tobilu/qmd` or `bun install -g @tobilu/qmd`)

## Quick start (development)

```bash
git clone https://github.com/ysskrishna/qmd-gui.git
cd qmd-gui
npm ci
npm run build
npm start
```

Opens `http://127.0.0.1:8765` by default.

## Scripts

| Script | Description |
| --- | --- |
| `npm run dev` | Vite dev server + API server (watch) |
| `npm run build` | Production web bundle + server compile |
| `npm start` | Run built `qmd-gui` |
| `npm test` | Vitest unit and integration tests |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript |

## License

MIT — see [LICENSE](LICENSE). qmd itself is MIT by Tobi Lutke and is **not** bundled; install it separately.
