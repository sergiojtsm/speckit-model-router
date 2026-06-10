import { test } from "node:test";
import assert from "node:assert/strict";
import { decodeKey } from "../src/core/keys.ts";

test("decodeKey: control keys", () => {
  assert.equal(decodeKey("\x03"), "ctrl-c");
  assert.equal(decodeKey("\x1b"), "escape");
  assert.equal(decodeKey("\r"), "enter");
  assert.equal(decodeKey("\n"), "enter");
});

test("decodeKey: arrows up/down only", () => {
  assert.equal(decodeKey("\x1b[A"), "up");
  assert.equal(decodeKey("\x1b[B"), "down");
});

test("decodeKey: regression left/right arrows are unknown (not down)", () => {
  assert.equal(decodeKey("\x1b[D"), "unknown");
  assert.equal(decodeKey("\x1b[C"), "unknown");
});

test("decodeKey: backspace variants (incl. forward Delete / Supr)", () => {
  assert.equal(decodeKey("\x7f"), "backspace");
  assert.equal(decodeKey("\b"), "backspace");
  assert.equal(decodeKey("\x1b[3~"), "backspace"); // Supr / forward Delete
});

test("decodeKey: printable chars", () => {
  for (const c of ["a", "Z", "/", " "]) assert.equal(decodeKey(c), "char");
});

test("decodeKey: unknown sequences", () => {
  assert.equal(decodeKey("\x1b[1;5A"), "unknown");
  assert.equal(decodeKey("\x00"), "unknown");
});
