import { test } from "node:test";
import assert from "node:assert/strict";
import { readModelForFrom } from "../src/plugin/router.ts";

test("readModelForFrom: returns the model for a mapped command", () => {
  const json = '{"speckit.plan":"google/gemini-2.5-pro","speckit.tasks":"anthropic/claude"}';
  assert.equal(readModelForFrom(json, "speckit.plan"), "google/gemini-2.5-pro");
});

test("readModelForFrom: null/empty/garbage input => null", () => {
  assert.equal(readModelForFrom(null, "speckit.plan"), null);
  assert.equal(readModelForFrom(undefined, "speckit.plan"), null);
  assert.equal(readModelForFrom("", "speckit.plan"), null);
  assert.equal(readModelForFrom("not json", "speckit.plan"), null);
  assert.equal(readModelForFrom("[1,2,3]", "speckit.plan"), null);
  assert.equal(readModelForFrom("42", "speckit.plan"), null);
  assert.equal(readModelForFrom("null", "speckit.plan"), null);
});

test("readModelForFrom: unmapped command => null", () => {
  const json = '{"speckit.plan":"g/p"}';
  assert.equal(readModelForFrom(json, "speckit.tasks"), null);
});

test("readModelForFrom: non-string or non provider/model value => null", () => {
  assert.equal(readModelForFrom('{"speckit.plan":123}', "speckit.plan"), null);
  assert.equal(readModelForFrom('{"speckit.plan":"noslash"}', "speckit.plan"), null);
  assert.equal(readModelForFrom('{"speckit.plan":"/leading"}', "speckit.plan"), null);
  assert.equal(readModelForFrom('{"speckit.plan":"trailing/"}', "speckit.plan"), null);
});

test("readModelForFrom: very long model id is accepted (no crash)", () => {
  const long = "provider/" + "m".repeat(100_000);
  const json = JSON.stringify({ "speckit.plan": long });
  assert.equal(readModelForFrom(json, "speckit.plan"), long);
});

test("readModelForFrom: __proto__ key does not pollute and is not returned", () => {
  // A JSON payload that tries to smuggle a value via __proto__.
  const json = '{"__proto__":{"speckit.plan":"evil/model"}}';
  // Looking up the real command must not see the smuggled value.
  assert.equal(readModelForFrom(json, "speckit.plan"), null);
  // Asking for "__proto__" itself: its value is an object, not a string => null.
  assert.equal(readModelForFrom(json, "__proto__"), null);
  // The global Object prototype must remain clean.
  assert.equal(({} as Record<string, unknown>)["speckit.plan"], undefined);
});

test("readModelForFrom: constructor/prototype keys are inert", () => {
  assert.equal(readModelForFrom('{"constructor":"a/b"}', "constructor"), "a/b");
  // ...but that does not affect lookups for real commands.
  assert.equal(readModelForFrom('{"constructor":"a/b"}', "speckit.plan"), null);
});
