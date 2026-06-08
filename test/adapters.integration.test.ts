import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync, existsSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

// These tests exercise the IO adapters against a throwaway config directory so
// they never touch the real ~/.config/opencode. We point OPENCODE_CONFIG_DIR at
// a temp dir and then dynamically import the adapters so they pick it up at
// module-evaluation time.

test("adapters: full install/uninstall + write/read/delete round-trip in a temp dir", async () => {
  const dir = mkdtempSync(join(tmpdir(), "smr-test-"));
  const prev = process.env.OPENCODE_CONFIG_DIR;
  process.env.OPENCODE_CONFIG_DIR = dir;

  try {
    // node --test isolates each test file in its own process, so these adapters
    // are imported here for the first time and pick up OPENCODE_CONFIG_DIR set above.
    const { PLUGIN_DEST, MODELS_FILE } = await import("../src/cli/adapters/paths.ts");
    const { isPluginInstalled, isPluginUpToDate, installPlugin, uninstallPlugin } = await import(
      "../src/cli/adapters/pluginInstaller.ts"
    );
    const { readModelMap, writeModelMap, deleteModelMap } = await import(
      "../src/cli/adapters/modelsStore.ts"
    );

    // Paths must resolve inside our temp dir.
    assert.ok(String(PLUGIN_DEST).startsWith(dir), "plugin dest under temp dir");
    assert.ok(String(MODELS_FILE).startsWith(dir), "models file under temp dir");

    // ── Plugin install lifecycle ──────────────────────────────────────
    assert.equal(isPluginInstalled(), false);
    assert.equal(isPluginUpToDate(), false);

    installPlugin();
    assert.equal(isPluginInstalled(), true);
    assert.equal(isPluginUpToDate(), true);
    assert.ok(existsSync(PLUGIN_DEST));

    assert.equal(uninstallPlugin(), true);
    assert.equal(isPluginInstalled(), false);
    assert.equal(uninstallPlugin(), false); // already gone → no-op

    // ── Model map lifecycle ───────────────────────────────────────────
    assert.deepEqual(readModelMap(), {});
    writeModelMap({ "speckit.plan": "google/gemini-2.5-pro" });
    assert.deepEqual(readModelMap(), { "speckit.plan": "google/gemini-2.5-pro" });
    assert.ok(readFileSync(MODELS_FILE, "utf8").endsWith("\n"));

    assert.equal(deleteModelMap(), true);
    assert.equal(existsSync(MODELS_FILE), false);
    assert.equal(deleteModelMap(), false); // already gone → no-op
    assert.deepEqual(readModelMap(), {});
  } finally {
    if (prev === undefined) delete process.env.OPENCODE_CONFIG_DIR;
    else process.env.OPENCODE_CONFIG_DIR = prev;
    rmSync(dir, { recursive: true, force: true });
  }
});
