import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url));
const fixtureDir = path.join(root, "qmd-2.8.3");
const logPath = process.env.FAKE_QMD_LOG;
const statePath = process.env.FAKE_QMD_STATE;
const cwdLogPath = process.env.FAKE_QMD_CWD_LOG;

const argv = process.argv.slice(2);

if (logPath) {
  fs.appendFileSync(logPath, `${JSON.stringify(argv)}\n`, "utf8");
}

function readState() {
  if (!statePath || !fs.existsSync(statePath)) return {};
  try {
    return JSON.parse(fs.readFileSync(statePath, "utf8"));
  } catch {
    return {};
  }
}

function writeState(patch) {
  if (!statePath) return;
  const next = { ...readState(), ...patch };
  fs.writeFileSync(statePath, JSON.stringify(next), "utf8");
}

function outFile(name) {
  const file = path.join(fixtureDir, name);
  process.stdout.write(fs.readFileSync(file, "utf8"));
  process.exit(0);
}

function exitOk() {
  process.exit(0);
}

if (argv.length === 1 && argv[0] === "--version") {
  console.log("qmd 2.8.3 (fixture)");
  process.exit(0);
}

if (argv[0] === "status") {
  let text = fs.readFileSync(path.join(fixtureDir, "status.txt"), "utf8");
  const st = readState();
  if (st.mcpPid) {
    text += `\nMCP: http://127.0.0.1:8181/mcp (PID ${st.mcpPid})\n`;
  }
  process.stdout.write(text);
  process.exit(0);
}

if (argv[0] === "collection" && argv[1] === "list") outFile("collection-list.txt");
else if (argv[0] === "collection" && argv[1] === "show") outFile("collection-show-demo.txt");
else if (argv[0] === "collection" && argv[1] === "add") exitOk();
else if (argv[0] === "collection" && argv[1] === "remove") exitOk();
else if (argv[0] === "collection" && argv[1] === "rename") exitOk();
else if (argv[0] === "collection" && (argv[1] === "include" || argv[1] === "exclude"))
  exitOk();
else if (argv[0] === "collection" && argv[1] === "update-cmd") exitOk();
else if (argv[0] === "context" && argv[1] === "add") exitOk();
else if (argv[0] === "context" && argv[1] === "rm") exitOk();
else if (argv[0] === "context" && argv[1] === "list") outFile("context-list.txt");
else if (argv[0] === "ls" && argv.length === 1) outFile("ls-root.txt");
else if (argv[0] === "ls") outFile("ls-demo.txt");
else if (argv[0] === "get") outFile("get-readme.txt");
else if (argv[0] === "cleanup" && argv.includes("--dry-run")) outFile("cleanup-dry-run.txt");
else if (argv[0] === "cleanup") exitOk();
else if (argv[0] === "doctor") outFile("doctor.txt");
else if (argv[0] === "update") exitOk();
else if (argv[0] === "embed") exitOk();
else if (argv[0] === "pull") exitOk();
else if (argv[0] === "mcp" && argv.includes("--http")) {
  writeState({ mcpPid: 424242 });
  exitOk();
} else if (argv[0] === "mcp" && argv[1] === "stop") {
  writeState({ mcpPid: null });
  exitOk();
} else if (argv[0] === "skill" && argv[1] === "install") {
  if (cwdLogPath) {
    fs.appendFileSync(cwdLogPath, `${process.cwd()}\n`, "utf8");
  }
  exitOk();
} else if (
  (argv[0] === "search" || argv[0] === "vsearch" || argv[0] === "query") &&
  argv.includes("--format") &&
  argv.includes("json")
) {
  outFile("search-sample.json");
}

console.error(`fake-qmd: no fixture for argv: ${JSON.stringify(argv)}`);
process.exit(1);
