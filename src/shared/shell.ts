/**
 * Render argv as a copy-pasteable shell command (preview only).
 */
export function toShell(argv: string[]): string {
  return ["qmd", ...argv].map(quoteShellArg).join(" ");
}

function quoteShellArg(arg: string): string {
  if (arg === "") return "''";
  if (/^[A-Za-z0-9_@%+=:,./-]+$/.test(arg)) return arg;
  if (!/['\s\\"$`!]/.test(arg)) return arg;
  return `'${arg.replace(/'/g, `'\\''`)}'`;
}

/**
 * Build a $'…' string for qmd typed multi-line queries (lex/vec/hyde/intent).
 */
export function toDollarQuote(lines: string[]): string {
  const body = lines.join("\n");
  const escaped = body
    .replace(/\\/g, "\\\\")
    .replace(/'/g, "\\'")
    .replace(/\n/g, "\\n");
  return `$'${escaped}'`;
}
