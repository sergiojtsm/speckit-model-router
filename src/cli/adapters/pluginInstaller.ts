// Installs the runtime plugin file into ~/.config/opencode/plugins/.
// We copy a single self-contained file (no opencode.json edits) so opencode
// auto-loads it from the global plugins directory on next start.

import { existsSync, mkdirSync, readFileSync, writeFileSync, rmSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { PLUGINS_DIR, PLUGIN_DEST } from "./paths.ts";

const HERE = dirname(fileURLToPath(import.meta.url));

/**
 * Resolve the bundled plugin source shipped inside this package.
 * In the built package it is dist/plugin/router.js (relative ../../plugin/router.js).
 * In dev (running TS) it is src/plugin/router.ts.
 */
function findBundledPlugin(): string {
  const candidates = [
    join(HERE, "..", "..", "plugin", "router.js"),
    join(HERE, "..", "..", "plugin", "router.ts"),
  ];
  for (const c of candidates) {
    if (existsSync(c)) return c;
  }
  throw new Error(`Bundled plugin file not found. Looked in:\n  ${candidates.join("\n  ")}`);
}

/** Whether the plugin file is already installed globally. */
export function isPluginInstalled(): boolean {
  return existsSync(PLUGIN_DEST);
}

/** Whether the installed plugin matches the bundled one (byte-for-byte). */
export function isPluginUpToDate(): boolean {
  if (!existsSync(PLUGIN_DEST)) return false;
  try {
    const src = readFileSync(findBundledPlugin(), "utf8");
    const dest = readFileSync(PLUGIN_DEST, "utf8");
    return src === dest;
  } catch {
    return false;
  }
}

/** Copy the bundled plugin into the global plugins dir. Returns the dest path. */
export function installPlugin(): string {
  const src = readFileSync(findBundledPlugin(), "utf8");
  mkdirSync(PLUGINS_DIR, { recursive: true });
  writeFileSync(PLUGIN_DEST, src, "utf8");
  return PLUGIN_DEST;
}

/**
 * Remove the installed plugin file from the global plugins dir.
 * Returns true if a file was removed, false if there was nothing to remove.
 * Leaves the plugins directory and everything else untouched.
 */
export function uninstallPlugin(): boolean {
  if (!existsSync(PLUGIN_DEST)) return false;
  rmSync(PLUGIN_DEST, { force: true });
  return true;
}
