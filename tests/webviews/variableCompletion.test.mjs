import { test } from "node:test";
import assert from "node:assert/strict";
import load, { nativeDependency } from "../helpers/loadTypeScript.mjs";

const { findVariableCompletion, completeVariable } = await load(
  "apps/webviews/src/features/variables/components/VarInput/completion.ts",
  nativeDependency,
);

for (const [value, caret, expected, expectedCaret] of [
  ["{{ba", 4, "{{baseUrl}}", 11],
  ["{{baUrl", 4, "{{baseUrl}}", 11],
  ["{{ba}}/users", 4, "{{baseUrl}}/users", 11],
  ["{{ba}", 4, "{{baseUrl}}", 11],
  ["{{ba|upper}}/users", 4, "{{baseUrl|upper}}/users", 9],
  ["{{baUrl|upper}}", 4, "{{baseUrl|upper}}", 9],
  ["prefix/{{ba", 11, "prefix/{{baseUrl}}", 18],
  ["before\n{{ba", 11, "before\n{{baseUrl}}", 18],
]) {
  test(`completion keeps reference boundaries and caret for ${JSON.stringify(value)}`, () => {
    const range = findVariableCompletion(value, caret);
    assert.ok(range);
    assert.equal(range.query, "ba");
    const edit = completeVariable(value, range, "baseUrl");
    assert.equal(edit.value, expected);
    assert.equal(edit.caret, expectedCaret);
  });
}

test("completion ignores selections, closed references, filters and newlines", () => {
  for (const value of [
    "plain",
    "{{baseUrl}}",
    "{{baseUrl|upper",
    "{{base\nUrl",
  ]) {
    assert.equal(findVariableCompletion(value, value.length), null);
  }
  assert.equal(findVariableCompletion("{{base", 4, 6), null);
});
