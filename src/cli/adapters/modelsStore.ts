// Adapter for reading/writing ~/.config/opencode/speckit-models.json.
// The only place that touches the model map file on disk.

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { OPENCODE_CONFIG_DIR, MODELS_FILE } from "./paths.ts";
import { parseModelMap, serializeModelMap, type ModelMap } from "../../core/modelMap.ts";

/** Read the model map. Returns {} if missing or unparseable (never throws). */
export function readModelMap(): ModelMap {
  if (!existsSync(MODELS_FILE)) return {};
  try {
    return parseModelMap(readFileSync(MODELS_FILE, "utf8"));
  } catch {
    return {};
  }
}

/** Write the model map (pretty, trailing newline). Creates the config dir. */
export function writeModelMap(map: ModelMap): void {
  mkdirSync(OPENCODE_CONFIG_DIR, { recursive: true });
  writeFileSync(MODELS_FILE, serializeModelMap(map), "utf8");
}
