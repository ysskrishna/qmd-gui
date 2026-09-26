import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url));
const fixtureDir = path.join(root, "qmd-2.8.3");
const logPath = process.env.FAKE_QMD_LOG;

const argv = process.argv.slice(2);

if (logPath) {
  fs.appendFileSync(logPath, `${JSON.stringify(argv)}\n`, "utf8");
}

function outFile(name) {
  const file = path.join(fixtureDir, name);
  process.stdout.write(fs.readFileSync(file, "utf8"));
  process.exit(0);
}

if (argv.length === 1 && argv[0] === "--version") {
  console.log("qmd 2.8.3 (fixture)");
  process.exit(0);
}

if (argv[0] === "status") outFile("status.txt");
else if (argv[0] === "collection" && argv[1] === "list") outFile("collection-list.txt");
else if (argv[0] === "collection" && argv[1] === "show") outFile("collection-show-demo.txt");
else if (argv[0] === "context" && argv[1] === "list") outFile("context-list.txt");
else if (argv[0] === "ls" && argv.length === 1) outFile("ls-root.txt");
else if (argv[0] === "ls") outFile("ls-demo.txt");
else if (argv[0] === "get") outFile("get-readme.txt");
else if (argv[0] === "cleanup" && argv.includes("--dry-run")) outFile("cleanup-dry-run.txt");
else if (
  (argv[0] === "search" || argv[0] === "vsearch" || argv[0] === "query") &&
  argv.includes("--format") &&
  argv.includes("json")
) {
  outFile("search-sample.json");
}

console.error(`fake-qmd: no fixture for argv: ${JSON.stringify(argv)}`);
process.exit(1);
