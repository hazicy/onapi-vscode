import { test } from "node:test";
import assert from "node:assert/strict";
import load from "../helpers/loadTypeScript.mjs";

async function setup({ writeText, copy = () => true } = {}) {
  const calls = [];
  const textarea = {
    style: {},
    select: () => calls.push("select"),
    remove: () => calls.push("remove"),
  };
  const { copyStringToClipboard } = await load(
    "apps/webviews/src/shared/utils/clipboard.ts",
    () => ({}),
    {
      navigator: { clipboard: writeText ? { writeText } : undefined },
      document: {
        createElement: () => textarea,
        body: { appendChild: () => calls.push("append") },
        execCommand: (command) => {
          assert.equal(command, "copy");
          return copy();
        },
      },
    },
  );
  return { copyStringToClipboard, calls, textarea };
}

test("native clipboard succeeds without selecting a temporary element", async () => {
  const written = [];
  const { copyStringToClipboard, calls } = await setup({
    writeText: async (text) => written.push(text),
  });
  await copyStringToClipboard("hello", () => calls.push("success"));
  assert.deepEqual(written, ["hello"]);
  assert.deepEqual(calls, ["success"]);
});

for (const unavailable of ["missing", "denied"]) {
  test(`clipboard ${unavailable} falls back and reports success for empty text`, async () => {
    const { copyStringToClipboard, calls, textarea } = await setup({
      writeText:
        unavailable === "denied"
          ? async () => {
              throw new Error("denied");
            }
          : undefined,
    });
    await copyStringToClipboard("", () => calls.push("success"));
    assert.equal(textarea.value, "");
    assert.deepEqual(calls, ["append", "select", "remove", "success"]);
  });
}

for (const failure of ["false", "throw"]) {
  test(`fallback returning ${failure} reports failure and removes its element`, async () => {
    const { copyStringToClipboard, calls } = await setup({
      copy: () => {
        if (failure === "throw") throw new Error("copy failed");
        return false;
      },
    });
    await copyStringToClipboard(
      "hello",
      () => calls.push("success"),
      () => calls.push("error"),
    );
    assert.deepEqual(calls, ["append", "select", "remove", "error"]);
  });
}
