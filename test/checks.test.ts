import { test } from "node:test";
import assert from "node:assert/strict";
import { evaluateChecks } from "../src/core/checks.ts";

const GOOD = { hasOpencode: true, hasSpecify: true, modelCount: 42, pluginInstalled: true };

test("all good => allOk", () => {
  const { allOk, checks } = evaluateChecks(GOOD);
  assert.equal(allOk, true);
  assert.ok(checks.every((c) => c.ok));
});

test("missing opencode blocks", () => {
  const { allOk } = evaluateChecks({ ...GOOD, hasOpencode: false, modelCount: 0 });
  assert.equal(allOk, false);
});

test("missing specify blocks", () => {
  assert.equal(evaluateChecks({ ...GOOD, hasSpecify: false }).allOk, false);
});

test("zero models blocks", () => {
  assert.equal(evaluateChecks({ ...GOOD, modelCount: 0 }).allOk, false);
});

test("missing plugin is a warning, not a blocker", () => {
  const { allOk, checks } = evaluateChecks({ ...GOOD, pluginInstalled: false });
  assert.equal(allOk, true);
  const plugin = checks.find((c) => c.id === "plugin")!;
  assert.equal(plugin.ok, false);
  assert.equal(plugin.warning, true);
});

test("model count shown when opencode present", () => {
  const c = evaluateChecks({ ...GOOD, modelCount: 382 }).checks.find((x) => x.id === "models")!;
  assert.match(c.label, /382 models/);
});
