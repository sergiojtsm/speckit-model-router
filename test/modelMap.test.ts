import { test } from "node:test";
import assert from "node:assert/strict";
import {
  isValidModelId,
  buildModelMap,
  parseModelMap,
  serializeModelMap,
  assignmentsForSteps,
  withStepCleared,
  clearedAll,
} from "../src/core/modelMap.ts";
import type { SddStep } from "../src/core/steps.ts";

const STEPS: SddStep[] = [
  { key: "speckit.specify", label: "/speckit.specify", desc: "" },
  { key: "speckit.plan", label: "/speckit.plan", desc: "" },
  { key: "speckit.tasks", label: "/speckit.tasks", desc: "" },
];

test("isValidModelId", () => {
  assert.equal(isValidModelId("anthropic/claude-opus-4"), true);
  assert.equal(isValidModelId("openrouter/openai/gpt"), true);
  assert.equal(isValidModelId("noslash"), false);
  assert.equal(isValidModelId("/leading"), false);
  assert.equal(isValidModelId("trailing/"), false);
  assert.equal(isValidModelId(42), false);
  assert.equal(isValidModelId(null), false);
});

test("buildModelMap: keeps only known steps with valid models", () => {
  const map = buildModelMap(
    {
      "speckit.plan": "google/gemini-2.5-pro",
      "speckit.specify": "bad-no-slash",
      "unknown.step": "anthropic/claude",
      "speckit.tasks": "anthropic/claude-opus-4",
    },
    STEPS,
  );
  assert.deepEqual(map, {
    "speckit.plan": "google/gemini-2.5-pro",
    "speckit.tasks": "anthropic/claude-opus-4",
  });
});

test("buildModelMap: empty/garbage input", () => {
  assert.deepEqual(buildModelMap({}, STEPS), {});
  assert.deepEqual(buildModelMap(null as any, STEPS), {});
});

test("parseModelMap: valid json", () => {
  const json = '{"speckit.plan":"google/gemini-2.5-pro","speckit.tasks":"anthropic/claude"}';
  assert.deepEqual(parseModelMap(json), {
    "speckit.plan": "google/gemini-2.5-pro",
    "speckit.tasks": "anthropic/claude",
  });
});

test("parseModelMap: invalid json / wrong shape / empty => {}", () => {
  assert.deepEqual(parseModelMap(""), {});
  assert.deepEqual(parseModelMap(null), {});
  assert.deepEqual(parseModelMap("not json"), {});
  assert.deepEqual(parseModelMap("[1,2,3]"), {});
  assert.deepEqual(parseModelMap('{"k":"noslash"}'), {});
});

test("parseModelMap: drops invalid entries but keeps valid ones", () => {
  assert.deepEqual(parseModelMap('{"a":"x/y","b":123,"c":"bad"}'), { a: "x/y" });
});

test("serializeModelMap: pretty + trailing newline, round-trips", () => {
  const map = { "speckit.plan": "google/gemini-2.5-pro" };
  const text = serializeModelMap(map);
  assert.ok(text.endsWith("\n"));
  assert.deepEqual(parseModelMap(text), map);
});

test("assignmentsForSteps: only steps present in map", () => {
  const map = { "speckit.plan": "g/p", "speckit.implement": "a/b" };
  assert.deepEqual(assignmentsForSteps(map, STEPS), { "speckit.plan": "g/p" });
});

test("withStepCleared: removes one key, does not mutate input", () => {
  const map = { "speckit.plan": "g/p", "speckit.tasks": "a/b" };
  const out = withStepCleared(map, "speckit.plan");
  assert.deepEqual(out, { "speckit.tasks": "a/b" });
  // original untouched
  assert.deepEqual(map, { "speckit.plan": "g/p", "speckit.tasks": "a/b" });
});

test("withStepCleared: missing key is a no-op (still a copy)", () => {
  const map = { "speckit.plan": "g/p" };
  const out = withStepCleared(map, "speckit.tasks");
  assert.deepEqual(out, { "speckit.plan": "g/p" });
  assert.notEqual(out, map);
});

test("clearedAll: returns an empty map", () => {
  assert.deepEqual(clearedAll(), {});
});
