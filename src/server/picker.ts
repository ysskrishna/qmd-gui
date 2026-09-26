import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

export async function pickFolder(): Promise<string | null> {
  const platform = process.platform;
  try {
    if (platform === "darwin") {
      const { stdout } = await execFileAsync("osascript", [
        "-e",
        'POSIX path of (choose folder with prompt "Select a folder for qmd")',
      ]);
      return stdout.trim() || null;
    }
    if (platform === "linux") {
      try {
        const { stdout } = await execFileAsync("zenity", [
          "--file-selection",
          "--directory",
          "--title=Select a folder for qmd",
        ]);
        return stdout.trim() || null;
      } catch {
        const { stdout } = await execFileAsync("kdialog", [
          "--getexistingdirectory",
          process.env.HOME ?? "/",
          "--title",
          "Select a folder for qmd",
        ]);
        return stdout.trim() || null;
      }
    }
    if (platform === "win32") {
      const script = [
        "$shell = New-Object -ComObject Shell.Application",
        "$folder = $shell.BrowseForFolder(0, 'Select a folder for qmd', 0)",
        "if ($folder -ne $null) { $folder.Self.Path }",
      ].join("; ");
      const { stdout } = await execFileAsync("powershell", [
        "-NoProfile",
        "-Command",
        script,
      ]);
      return stdout.trim() || null;
    }
    return null;
  } catch {
    return null;
  }
}

export function pickerAvailable(): boolean {
  return process.platform === "darwin" || process.platform === "win32";
}
