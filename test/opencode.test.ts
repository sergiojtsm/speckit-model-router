import { test } from "node:test";
import assert from "node:assert/strict";
import { locatorFor } from "../src/cli/adapters/opencode.ts";

test("locatorFor: where on Windows, which elsewhere", () => {
  assert.equal(locatorFor("win32"), "where");
  assert.equal(locatorFor("linux"), "which");
  assert.equal(locatorFor("darwin"), "which");
});
