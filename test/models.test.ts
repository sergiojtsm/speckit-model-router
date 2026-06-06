import { test } from "node:test";
import assert from "node:assert/strict";
import {
  parseModelsOutput,
  filterModels,
  computePage,
  splitModelId,
  clampCursor,
} from "../src/core/models.ts";

test("parseModelsOutput: trims and drops blanks", () => {
  assert.deepEqual(parseModelsOutput("a/b\n  c/d  \n\ne/f\n"), ["a/b", "c/d", "e/f"]);
});

test("parseModelsOutput: empty input", () => {
  assert.deepEqual(parseModelsOutput(""), []);
  assert.deepEqual(parseModelsOutput(null), []);
});

test("filterModels: empty query returns all", () => {
  const m = ["a/b", "c/d"];
  assert.equal(filterModels(m, ""), m);
  assert.equal(filterModels(m, "  "), m);
});

test("filterModels: case-insensitive substring", () => {
  const m = ["anthropic/claude", "google/gemini-2.5-pro", "openrouter/openai/gpt"];
  assert.deepEqual(filterModels(m, "GEMINI"), ["google/gemini-2.5-pro"]);
  assert.deepEqual(filterModels(m, "open"), ["openrouter/openai/gpt"]);
});

test("computePage: small list shows all", () => {
  assert.deepEqual(computePage(0, 5, 15), { start: 0, end: 5 });
});

test("computePage: centers and clamps", () => {
  assert.deepEqual(computePage(99, 100, 15), { start: 85, end: 100 });
  assert.equal(computePage(0, 100, 15).start, 0);
});

test("computePage: empty list", () => {
  assert.deepEqual(computePage(0, 0, 15), { start: 0, end: 0 });
});

test("splitModelId", () => {
  assert.deepEqual(splitModelId("anthropic/claude-opus-4"), { provider: "anthropic", name: "claude-opus-4" });
  assert.deepEqual(splitModelId("openrouter/openai/gpt"), { provider: "openrouter", name: "openai/gpt" });
  assert.deepEqual(splitModelId("local"), { provider: "", name: "local" });
});

test("clampCursor", () => {
  assert.equal(clampCursor(-3, 10), 0);
  assert.equal(clampCursor(20, 10), 10);
  assert.equal(clampCursor(5, -1), 0);
});
