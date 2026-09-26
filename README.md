# qmd-gui

<p align="center">
  <strong>Local web UI for the <a href="https://github.com/tobilu/qmd">qmd</a> CLI</strong> — search markdown collections, edit index settings, manage context, and run maintenance without memorizing every flag.
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/qmd-gui"><img src="https://img.shields.io/npm/v/qmd-gui.svg?style=flat-square" alt="npm version" /></a>
  <a href="https://github.com/ysskrishna/qmd-gui/actions/workflows/ci.yml"><img src="https://github.com/ysskrishna/qmd-gui/actions/workflows/ci.yml/badge.svg" alt="CI" /></a>
  <a href="https://nodejs.org/"><img src="https://img.shields.io/node/v/qmd-gui.svg?style=flat-square" alt="Node 22+" /></a>
  <a href="LICENSE"><img src="https://img.shields.io/github/license/ysskrishna/qmd-gui.svg?style=flat-square" alt="License: MIT" /></a>
</p>

## Requirements

- **Node.js** 22 or newer
- **[qmd](https://www.npmjs.com/package/@tobilu/qmd)** 2.8+ on your `PATH` (MIT, by Tobi Lutke — not bundled)

```bash
npm install -g @tobilu/qmd
# or: bun install -g @tobilu/qmd
```

## Quick start

```bash
npx qmd-gui
```

Opens **http://127.0.0.1:8765** and starts a local API that shells out to `qmd` for every action.

```bash
# Custom port / host / qmd binary
qmd-gui start --port 9000 --host 127.0.0.1 --qmd ~/.bun/bin/qmd --no-open

# Background + PID file (~/.cache/qmd-gui/server.pid)
qmd-gui start --detach
qmd-gui status
qmd-gui stop
```

## What you can do

| Area | Features |
| --- | --- |
| **Search** | Keyword, vector, and hybrid modes; collection scope; `qmd get` document drawer |
| **Collections** | Add folders, include/exclude default search, embed, rename, settings → `index.yml` + `qmd update` |
| **Context** | Global and per-collection descriptions (`qmd context`) |
| **Index** | Status cards, `update` / `embed` / `pull` / `cleanup` / `doctor` with live command preview |
| **AI agents** | MCP HTTP server start/stop, stdio config snippet, `qmd skill install` |

Command previews always match what the server runs (`src/shared/commands.ts`).

## Security

- Intended for **local** use on loopback. Binding to `0.0.0.0` requires HTTP basic auth (`QMD_GUI_USER` / `QMD_GUI_PASSWORD`).
- Every API call needs the session token served in the HTML shell.
- Wrong `Host` headers are rejected.

## FAQ

### Why can’t I toggle a single file in/out of the index?

qmd works on **collections** (folder + pattern + ignore). Exclude files with ignore globs or a tighter pattern on the collection **Settings** tab, not a per-file switch.

### Why does settings save say “Conflict”?

`index.yml` changed on disk since the page loaded. Reload and try again; unrelated keys and comments are preserved when the GUI writes YAML.

### Search works but hybrid/vector is empty

Run **Generate embeddings** on the Index page and ensure models are pulled (`qmd pull`). Keyword search does not need embeddings.

## License

MIT © [Y. Siva Sai Krishna](https://github.com/ysskrishna) — see [LICENSE](LICENSE) for details.

---

<p align="left">
  <a href="https://github.com/ysskrishna">Author's GitHub</a> •
  <a href="https://linkedin.com/in/ysskrishna">Author's LinkedIn</a> •
  <a href="https://ysskrishna.space">Author's site</a> •
  <a href="https://github.com/ysskrishna/qmd-gui/issues">Report Issues</a>
</p>

## Credits

[qmd](https://github.com/tobilu/qmd) is by [Tobi Lütke](https://github.com/tobilu). This project is a separate UI and does not bundle qmd.

## Resources

- [Configuration and CLI options](docs/configuration.md)
- [Development](docs/development.md)
- [Release history (CHANGELOG)](CHANGELOG.md)

## Support

If you find this project helpful:

- Star the [repository](https://github.com/ysskrishna/qmd-gui)
- [Report issues](https://github.com/ysskrishna/qmd-gui/issues)
- Submit pull requests
- [Sponsor on GitHub](https://github.com/sponsors/ysskrishna)
