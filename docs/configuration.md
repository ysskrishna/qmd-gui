# Configuration

qmd-gui does not replace qmd’s own configuration. It reads the same paths and `index.yml` that the CLI uses, and shells out to your installed `qmd` binary for every operation.

## qmd config location

Resolved in this order:

1. `QMD_CONFIG_DIR` — directory containing `index.yml`
2. `$XDG_CONFIG_HOME/qmd` (when `XDG_CONFIG_HOME` is set)
3. `~/.config/qmd`

The sidebar shows the resolved `index.yml` path as **Default index**.

## Environment variables

| Variable | Purpose |
| --- | --- |
| `HOST` | Bind address (default `127.0.0.1`). Non-loopback bind requires `QMD_GUI_USER` and `QMD_GUI_PASSWORD`. |
| `PORT` | GUI port (default `8765`). |
| `QMD_GUI_QMD_BIN` | Path to the `qmd` executable when it is not on `PATH`. |
| `QMD_CONFIG_DIR` | qmd config directory (see above). |
| `QMD_GUI_USER` / `QMD_GUI_PASSWORD` | HTTP basic auth when binding outside loopback. |
| `QMD_EDITOR_URI` | Optional `editor://` template for “open in editor” in the document drawer. |

qmd-gui reads `PATH` from the process that starts the server, not from an interactive shell. If `qmd` works in Terminal but not in the GUI, find the binary (`command -v qmd` on macOS/Linux, `where.exe qmd` on Windows), set `QMD_GUI_QMD_BIN` or pass `--qmd`, then **restart** qmd-gui.

CLI flags override defaults where supported: `qmd-gui start --port 9000 --host 127.0.0.1 --qmd /path/to/qmd --no-open`.

## MCP defaults

- GUI: port **8765**
- MCP HTTP (Agents page): port **8181** by default

If MCP and GUI share the same port, the UI warns you before starting the server.

## Security model

- Requests must use a valid `Host` header matching the bind address and port.
- Default bind is loopback only. Non-loopback binds require `QMD_GUI_USER` and `QMD_GUI_PASSWORD` (basic auth).
- There is no CORS for cross-origin browser access.
- `collection update-cmd` runs arbitrary shell in the collection folder — only use on machines you trust.

## FAQ

### Why can’t I include or exclude a single file?

qmd indexes **collections** (folders + pattern + ignore list), not individual files. To drop one file, narrow the **pattern** or add an **ignore** glob on the collection Settings tab, then save (which runs `qmd update` when needed).

### Why did settings save fail with “Conflict”?

Another process changed `index.yml` on disk. Reload the page and re-apply your edits; the server uses a `baseHash` precondition to avoid clobbering unrelated YAML.

### Why is hybrid/vector search empty?

Run **Generate embeddings** on the Index page (`qmd embed`) after adding files. Keyword search works without models; hybrid and vector need embeddings and downloaded models (`qmd pull`).
