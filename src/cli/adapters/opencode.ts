// Adapter for the opencode/specify CLIs and tool availability checks.
// Side-effects: spawns child processes. Returns plain data.

import { execSync, spawnSync } from "node:child_process";
import { parseModelsOutput } from "../../core/models.ts";

/** Whether an executable is resolvable on PATH. */
export function checkTool(cmd: string): boolean {
  try {
    execSync(`which ${cmd}`, { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

/** Run `opencode models` and return the parsed list. Returns [] on failure. */
export function getOpencodeModels(): string[] {
  try {
    const r = spawnSync("opencode", ["models"], { encoding: "utf8", timeout: 15000 });
    if (r.status !== 0 || !r.stdout) return [];
    return parseModelsOutput(r.stdout);
  } catch {
    return [];
  }
}
