// Adapter for the opencode/specify CLIs and tool availability checks.
// Side-effects: spawns child processes. Returns plain data.

import { spawnSync } from "node:child_process";
import { parseModelsOutput } from "../../core/models.ts";

/**
 * The PATH locator for the current platform: `where` on Windows, `which`
 * elsewhere. Pure (no side-effects) so it can be unit-tested.
 */
export function locatorFor(platform: NodeJS.Platform = process.platform): string {
  return platform === "win32" ? "where" : "which";
}

/**
 * Whether an executable is resolvable on PATH. Runs the platform locator
 * WITHOUT a shell (args are passed as an array) so a tool name can never be
 * interpreted as a shell command — no injection surface.
 */
export function checkTool(cmd: string): boolean {
  try {
    const r = spawnSync(locatorFor(), [cmd], { stdio: "ignore" });
    return r.status === 0;
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
