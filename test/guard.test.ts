import { test } from "node:test";
import assert from "node:assert/strict";

// Guard tests: the plugin (src/plugin/router.ts) is copied standalone into the
// opencode plugins dir and therefore CANNOT import from the package. A few
// domain values are duplicated by hand on both sides. These tests fail loudly if
// the two copies ever drift apart, so the CLI never writes where the plugin
// can't read.

import {
  SPECKIT_PREFIX as PLUGIN_PREFIX,
  MODELS_FILENAME as PLUGIN_MODELS_FILENAME,
  resolveConfigDir as pluginResolveConfigDir,
  readModelForFrom,
} from "../src/plugin/router.ts";

import {
  MODELS_FILENAME as CLI_MODELS_FILENAME,
  resolveConfigDir as cliResolveConfigDir,
} from "../src/cli/adapters/paths.ts";

import { isValidModelId } from "../src/core/modelMap.ts";
import { SDD_STEPS } from "../src/core/steps.ts";

test("guard: models filename matches between plugin and CLI", () => {
  assert.equal(PLUGIN_MODELS_FILENAME, CLI_MODELS_FILENAME);
});

test("guard: resolveConfigDir matches between plugin and CLI (default)", () => {
  const prev = process.env.OPENCODE_CONFIG_DIR;
  delete process.env.OPENCODE_CONFIG_DIR;
  try {
    assert.equal(pluginResolveConfigDir(), cliResolveConfigDir());
  } finally {
    if (prev !== undefined) process.env.OPENCODE_CONFIG_DIR = prev;
  }
});

test("guard: resolveConfigDir matches between plugin and CLI (override)", () => {
  const prev = process.env.OPENCODE_CONFIG_DIR;
  process.env.OPENCODE_CONFIG_DIR = "/tmp/guard-config";
  try {
    assert.equal(pluginResolveConfigDir(), cliResolveConfigDir());
    assert.equal(pluginResolveConfigDir(), "/tmp/guard-config");
  } finally {
    if (prev === undefined) delete process.env.OPENCODE_CONFIG_DIR;
    else process.env.OPENCODE_CONFIG_DIR = prev;
  }
});

test("guard: every SDD step key uses the plugin's speckit prefix", () => {
  for (const step of SDD_STEPS) {
    assert.ok(
      step.key.startsWith(PLUGIN_PREFIX),
      `step key "${step.key}" must start with "${PLUGIN_PREFIX}"`,
    );
  }
});

test("guard: provider/model validation agrees between plugin and core", () => {
  // The plugin's readModelForFrom must accept exactly the values core.isValidModelId accepts.
  const samples = [
    "google/gemini-2.5-pro",
    "anthropic/claude-opus-4",
    "openrouter/openai/gpt", // multiple slashes, still valid
    "noslash",
    "/leading",
    "trailing/",
    "",
    "a/b",
  ];
  for (const value of samples) {
    const json = JSON.stringify({ "speckit.plan": value });
    const pluginAccepts = readModelForFrom(json, "speckit.plan") !== null;
    const coreAccepts = isValidModelId(value);
    assert.equal(
      pluginAccepts,
      coreAccepts,
      `disagreement on "${value}": plugin=${pluginAccepts} core=${coreAccepts}`,
    );
  }
});
