import { test } from "node:test";
import assert from "node:assert/strict";
import load, { nativeDependency } from "../helpers/loadTypeScript.mjs";

const base =
  "apps/webviews/src/features/variables/components/VarInsertPop/components/";
const constants = await load(
  "apps/webviews/src/features/variables/constants/variable.ts",
  nativeDependency,
);
const variable = await load(
  "apps/webviews/src/features/variables/utils/variable.ts",
  nativeDependency,
);
const dependencies = (id) => {
  if (id === "@/features/variables/constants/variable") return constants;
  if (id === "@/features/variables/utils/variable") return variable;
  return nativeDependency(id);
};
const { createVariableDraft, variableDraftReducer } = await load(
  base + "variable-draft.ts",
  dependencies,
);
const { buildVariableExpression, getInsertionValue } = await load(
  base + "variable-expression.ts",
  dependencies,
);
const plain = (value) => JSON.parse(JSON.stringify(value));
const { VAR_OPTIONS_KEY: options, ASSIGNMENT_VALUE_KEY } = constants;

test("selecting a different Faker value clears obsolete parameters without changing its function pipeline", () => {
  const original = createVariableDraft({
    value: "string.alpha",
    parameters: [{ key: "length", value: 10 }],
    functions: [{ func_name: "upper", paras: {} }],
  });
  const snapshot = plain(original);
  const next = variableDraftReducer(original, {
    type: "mock-value",
    value: "person.fullName",
  });
  assert.equal(next.value, "person.fullName");
  assert.deepEqual(plain(next.parameters), []);
  assert.deepEqual(plain(next.functions), snapshot.functions);
  assert.deepEqual(plain(original), snapshot);
});

test("mode changes reset source functions and arguments together; value refreshes preserve user edits", () => {
  const edited = createVariableDraft({
    value: "edited",
    functions: [{ func_name: "upper", paras: {} }],
    parameters: [{ key: "old", value: 1 }],
  });
  const refreshed = variableDraftReducer(edited, {
    type: "origin-value",
    value: "generated",
  });
  assert.equal(refreshed.value, "generated");
  assert.equal(refreshed.functions, edited.functions);
  assert.equal(refreshed.parameters, edited.parameters);
  const changed = variableDraftReducer(refreshed, {
    type: "option",
    isEdit: false,
    origin: {},
  });
  assert.equal(changed.value, "");
  assert.deepEqual(plain(changed.functions), []);
  assert.deepEqual(plain(changed.parameters), []);
  const editing = variableDraftReducer(refreshed, {
    type: "option",
    isEdit: true,
    origin: { functions: [{ func_name: "lower", paras: {} }] },
  });
  assert.equal(editing.value, "generated");
  assert.equal(editing.functions[0].func_name, "lower");
});

test("fixed, variable, Faker date and AI expressions share one correctly delimited pipeline", () => {
  const draft = createVariableDraft({
    value: "name",
    functions: [
      { func_name: "upper", paras: {} },
      { func_name: "substr", paras: { substr: { start: 1, length: 2 } } },
    ],
  });
  assert.equal(
    buildVariableExpression(options.var, draft),
    "{{name|upcase|slice: 1, 2}}",
  );
  assert.equal(
    buildVariableExpression(options.fixed, draft),
    '{{"name"|upcase|slice: 1, 2}}',
  );
  assert.equal(
    buildVariableExpression(options.ai_value, {
      ...draft,
      value: ASSIGNMENT_VALUE_KEY.random,
    }),
    '{{"random"|upcase|slice: 1, 2}}',
  );
  const date = createVariableDraft({
    value: "date.past",
    dateFormat: { format: "YYYY-MM-DD", utc: "+08:00" },
  });
  assert.equal(
    buildVariableExpression(options.mock, date),
    '{{"date.past"|faker|format: "YYYY-MM-DD", "+08:00"}}',
  );
  const faker = createVariableDraft({
    value: "string.alpha",
    parameters: [
      { key: "length.min", value: 3 },
      { key: "coordinates", value: [1, 2] },
    ],
  });
  assert.equal(
    buildVariableExpression(options.mock, faker),
    '{{"string.alpha"|faker: min: 3, coordinates: "[1,2]"}}',
  );
});

test("description insertion uses raw text and other modes insert the generated expression", () => {
  for (const option of [options.desc, options.ai_desc])
    assert.equal(
      getInsertionValue(option, "Description", "{{Description}}"),
      "Description",
    );
  for (const option of [
    options.var,
    options.fixed,
    options.mock,
    options.ai_value,
  ])
    assert.equal(getInsertionValue(option, "value", "{{value}}"), "{{value}}");
});

test("previews respect variable scope precedence and include only selected custom functions", async () => {
  const globals = Object.freeze({ token: "global", shared: "global-only" });
  const environment = Object.freeze({ token: "environment" });
  const calls = [];
  const { evaluateVariablePreview } = await load(
    base + "variable-preview.ts",
    (id) => {
      if (id === "@/shared/constants/system")
        return { SYSTEM_VARS: { token: "system" } };
      if (id === "@/features/requests/utils/send-utils")
        return { getGlobals: async () => globals };
      if (id === "@onapi/domain/mock/expressions")
        return {
          mockExp: (...args) => {
            calls.push(plain(args));
            return { result: true };
          },
        };
      return dependencies(id);
    },
  );
  const input = {
    option: options.var,
    value: "token",
    expression: "{{token}}",
    functions: [],
    environment,
    functionSources: {},
    language: "en",
    undefinedTip: "undefined",
  };
  assert.equal(await evaluateVariablePreview(input), "environment");
  assert.equal(calls.length, 0);
  assert.equal(
    await evaluateVariablePreview({
      ...input,
      expression: "{{token|fn_selected}}",
      functions: [{ func_name: "fn_selected" }, { func_name: "upper" }],
      functionSources: { fn_selected: "return text;", fn_unused: "return 0;" },
    }),
    '{"result":true}',
  );
  assert.equal(calls[0][1].token, "environment");
  assert.equal(calls[0][1].shared, "global-only");
  assert.equal(calls[0][1].$token, "system");
  assert.deepEqual(calls[0][3], { fn_selected: "return text;" });
  assert.deepEqual(globals, { token: "global", shared: "global-only" });
});
