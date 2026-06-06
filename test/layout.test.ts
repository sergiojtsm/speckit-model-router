import { test } from "node:test";
import assert from "node:assert/strict";
import { computeLayout, pad } from "../src/core/layout.ts";

test("pad: fills short strings to exact length", () => {
  assert.equal(pad("ab", 5), "ab   ");
  assert.equal(pad("ab", 5).length, 5);
});

test("pad: truncates long strings to len with trailing space", () => {
  assert.equal(pad("abcdef", 4), "abc ");
});

test("pad: null/undefined become empty", () => {
  assert.equal(pad(null, 3), "   ");
  assert.equal(pad(undefined, 3), "   ");
});

test("pad: non-positive length returns empty", () => {
  assert.equal(pad("abc", 0), "");
  assert.equal(pad("abc", -5), "");
});

test("computeLayout: never negative across widths", () => {
  for (let w = 5; w <= 300; w++) {
    const { cmd, model, desc } = computeLayout(w);
    assert.ok(cmd >= 0 && model >= 0 && desc >= 0, `negative at width ${w}`);
  }
});

test("computeLayout: drops description on narrow terminals", () => {
  const r = computeLayout(40);
  assert.equal(r.showDesc, false);
  assert.equal(r.desc, 0);
});

test("computeLayout: regression width 68 must not crash", () => {
  const r = computeLayout(68);
  assert.ok(r.model > 0 && r.cmd > 0);
});

test("computeLayout: model grows on wider terminals", () => {
  assert.ok(computeLayout(200).model > computeLayout(120).model);
});
