import { test } from "node:test";
import assert from "node:assert/strict";
import { build } from "esbuild";
import { mkdtemp, writeFile, rm } from "node:fs/promises";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";
import os from "node:os";

// Bundle the same public entrypoints used by the applications. No test-only import aliases,
// synthetic exports or mocked domain dependencies can hide a broken module edge.
test("public domain and contract entrypoints work with the real variable editor utilities", async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "onapi-entrypoints-"));
  try {
    const result = await build({
      stdin: {
        contents: `export {createDefaultHttpConfig, requestDefinition, requestUrl} from '@onapi/domain';
export {REQUEST_EXECUTION_EVENT} from '@onapi/contracts';
export {VAR_OPTIONS_KEY, FAKER_SPLIT_CONST} from '../apps/webviews/src/features/variables/constants/variable';
export {createVariableDraft} from '../apps/webviews/src/features/variables/components/VarInsertPop/components/variable-draft';
export {buildVariableExpression} from '../apps/webviews/src/features/variables/components/VarInsertPop/components/variable-expression';`,
        resolveDir: fileURLToPath(new URL("..", import.meta.url)),
      },
      bundle: true,
      platform: "node",
      format: "esm",
      write: false,
      banner: {
        js: 'import {createRequire} from "node:module";const require=createRequire(import.meta.url);',
      },
    });
    const filename = path.join(directory, "entrypoints.mjs");
    await writeFile(filename, result.outputFiles[0].contents);
    const api = await import(pathToFileURL(filename).href);
    assert.equal(api.REQUEST_EXECUTION_EVENT, "requestExecutionEvent");
    assert.equal(api.createDefaultHttpConfig().activeEnvironment, "default");
    assert.equal(
      api.createDefaultHttpConfig().environments[0].values[0].key,
      "baseUrl",
    );
    const request = api.requestDefinition({
      kind: "api",
      request: { method: "GET", url: "https://example.test/path" },
    });
    assert.equal(api.requestUrl(request), "https://example.test/path");
    const draft = api.createVariableDraft({
      value: `String${api.FAKER_SPLIT_CONST}alpha`,
      parameters: [{ key: "length", value: 4 }],
      functions: [{ func_name: "upper", paras: {} }],
    });
    assert.equal(
      api.buildVariableExpression(api.VAR_OPTIONS_KEY.mock, draft),
      "{{$fakerjs.String.alpha(length=4)|upper}}",
    );
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
