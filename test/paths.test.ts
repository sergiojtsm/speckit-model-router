import { test } from "node:test";
import assert from "node:assert/strict";
import { join } from "node:path";
import { homedir } from "node:os";
import { resolveConfigDir } from "../src/cli/adapters/paths.ts";

test("resolveConfigDir: defaults to ~/.config/opencode when env unset", () => {
  const prev = process.env.OPENCODE_CONFIG_DIR;
  delete process.env.OPENCODE_CONFIG_DIR;
  try {
    assert.equal(resolveConfigDir(), join(homedir(), ".config", "opencode"));
  } finally {
    if (prev !== undefined) process.env.OPENCODE_CONFIG_DIR = prev;
  }
});

test("resolveConfigDir: honours OPENCODE_CONFIG_DIR", () => {
  const prev = process.env.OPENCODE_CONFIG_DIR;
  process.env.OPENCODE_CONFIG_DIR = "/tmp/custom-opencode";
  try {
    assert.equal(resolveConfigDir(), "/tmp/custom-opencode");
  } finally {
    if (prev === undefined) delete process.env.OPENCODE_CONFIG_DIR;
    else process.env.OPENCODE_CONFIG_DIR = prev;
  }
});

test("resolveConfigDir: trims whitespace and ignores empty override", () => {
  const prev = process.env.OPENCODE_CONFIG_DIR;
  process.env.OPENCODE_CONFIG_DIR = "  /tmp/spaced  ";
  try {
    assert.equal(resolveConfigDir(), "/tmp/spaced");
  } finally {
    if (prev === undefined) delete process.env.OPENCODE_CONFIG_DIR;
    else process.env.OPENCODE_CONFIG_DIR = prev;
  }

  const prev2 = process.env.OPENCODE_CONFIG_DIR;
  process.env.OPENCODE_CONFIG_DIR = "   ";
  try {
    assert.equal(resolveConfigDir(), join(homedir(), ".config", "opencode"));
  } finally {
    if (prev2 === undefined) delete process.env.OPENCODE_CONFIG_DIR;
    else process.env.OPENCODE_CONFIG_DIR = prev2;
  }
});
