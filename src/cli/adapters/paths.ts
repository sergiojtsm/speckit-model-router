// Filesystem locations. The CLI only ever writes inside ~/.config/opencode/:
//   - speckit-models.json   (the per-user model map; data, never committed)
//   - plugins/speckit-model-router.js   (the runtime plugin file)
// It NEVER touches opencode.json.

import { join } from "node:path";
import { homedir } from "node:os";

export const OPENCODE_CONFIG_DIR = join(homedir(), ".config", "opencode");
export const MODELS_FILE = join(OPENCODE_CONFIG_DIR, "speckit-models.json");
export const PLUGINS_DIR = join(OPENCODE_CONFIG_DIR, "plugins");

/** The plugin filename installed into the global plugins dir. */
export const PLUGIN_FILENAME = "speckit-model-router.js";
export const PLUGIN_DEST = join(PLUGINS_DIR, PLUGIN_FILENAME);
