# Development

```bash
git clone https://github.com/ysskrishna/qmd-gui.git
cd qmd-gui
npm ci
npm run build
npm start
```

| Script | Description |
| --- | --- |
| `npm run dev` | Vite + API server with watch |
| `npm test` | Unit and integration tests (Vitest) |
| `npm run test:e2e` | Playwright (Chromium) against built app + fake-qmd |
| `npm run test:smoke` | Real `qmd` 2.8.x API smoke (CI / local) |
| `npm run lint` / `typecheck` / `build` | Quality gates |

## qmd works in Terminal but not in qmd-gui

The dev server and `qmd-gui start` inherit `PATH` from whatever launched them (IDE, Dock, systemd, etc.), not from your shell profile.

1. In the same environment that will run qmd-gui, locate the binary:
   - macOS/Linux: `command -v qmd`
   - Windows: `where.exe qmd`
2. Start with an explicit path:
   - `QMD_GUI_QMD_BIN=/absolute/path/to/qmd npm run dev`
   - or `qmd-gui start --qmd /absolute/path/to/qmd`
3. Restart qmd-gui after changing `PATH` or the override.

## Git hooks

`npm install` and `npm ci` run the `prepare` script, which turns on Husky. The pre-commit hook runs ESLint on staged `.ts` and `.tsx` files. Warnings do not block the commit. Errors do.
