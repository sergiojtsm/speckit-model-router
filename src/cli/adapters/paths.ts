// Filesystem locations. The CLI only ever writes inside opencode's config dir:
//   - speckit-models.json   (the per-user model map; data, never committed)
//   - plugins/speckit-model-router.js   (the runtime plugin file)
// It NEVER touches opencode.json.
//
// The config directory honours OPENCODE_CONFIG_DIR (opencode's own override),
// falling back to ~/.config/opencode. Path construction uses path.join + homedir
// so it is correct on macOS, Linux and Windows.
//
// NOTE: the installed plugin is a single self-contained file and cannot import
// this module. It mirrors `resolveConfigDir()` inline — keep both in sync.

import { join } from "node:path";
import { homedir } from "node:os";

/** The filename of the model-map data file inside the config dir. */
export const MODELS_FILENAME = "speckit-models.json";

/** The subdirectory (within the config dir) where opencode loads plugins. */
export const PLUGINS_DIRNAME = "plugins";

/** The plugin filename installed into the global plugins dir. */
export const PLUGIN_FILENAME = "speckit-model-router.js";

/**
 * Resolve opencode's global config directory.
 * Honours OPENCODE_CONFIG_DIR (set by users who relocate their config),
 * otherwise defaults to ~/.config/opencode.
 */
export function resolveConfigDir(): string {
  const override = process.env.OPENCODE_CONFIG_DIR?.trim();
  if (override) return override;
  return join(homedir(), ".config", "opencode");
}

export const OPENCODE_CONFIG_DIR = resolveConfigDir();
export const MODELS_FILE = join(OPENCODE_CONFIG_DIR, MODELS_FILENAME);
export const PLUGINS_DIR = join(OPENCODE_CONFIG_DIR, PLUGINS_DIRNAME);
export const PLUGIN_DEST = join(PLUGINS_DIR, PLUGIN_FILENAME);
