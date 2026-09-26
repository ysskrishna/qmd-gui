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

## Git hooks

`npm install` and `npm ci` run the `prepare` script, which turns on Husky. The pre-commit hook runs ESLint on staged `.ts` and `.tsx` files. Warnings do not block the commit. Errors do.
