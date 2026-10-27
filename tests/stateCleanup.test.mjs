import { test } from "node:test";
import assert from "node:assert/strict";
import load, { nativeDependency } from "./helpers/loadTypeScript.mjs";

const zustand = await nativeDependency("zustand");
const {
  default: useApis,
  selectRequestIndex,
  selectIsDirty,
} = await load(
  "apps/webviews/src/features/requests/store/useApis/index.ts",
  (id) => {
    if (id === "@/shared/state/store")
      return { create: zustand.create, devtools: (initializer) => initializer };
    if (id.endsWith("requests/constants/request"))
      return { DEFAULT_REQUEST_SYSTEM_HEADERS: [] };
    if (id === "lodash-es") return nativeDependency(id);
    return {};
  },
);
const scopes = await load(
  "apps/webviews/src/features/project/store/useProjectConfig/selectors.ts",
  () => ({}),
);

test("request indexes follow collection replacement and clearing console updates the displayed execution", () => {
  const first = { id: "one", name: "Old" };
  useApis.getState().updateApiOriginDetailsList([first]);
  const index = selectRequestIndex(useApis.getState());
  assert.equal(index.one, first);
  assert.equal(selectRequestIndex(useApis.getState()), index);
  useApis.getState().updateApiOriginDetailsList([{ id: "two", name: "New" }]);
  const replacement = selectRequestIndex(useApis.getState());
  assert.equal(replacement.one, undefined);
  assert.equal(replacement.two.name, "New");
  const execution = {
    response: { code: 200 },
    consoleList: [{ messages: ["log"] }],
  };
  useApis.getState().updateCurrentSendingData(execution);
  useApis.getState().clearConsole();
  assert.equal(
    useApis.getState().currentSendingData.response,
    execution.response,
  );
  assert.equal(useApis.getState().currentSendingData.consoleList.length, 0);
  assert.equal(execution.consoleList.length, 1);
});

test("native scope values preserve false, zero and empty values and ignore disabled variables", () => {
  const environment = {
    id: "active",
    values: [
      { key: "zero", value: 0 },
      { key: "flag", value: false },
      { key: "empty", value: "" },
      { key: "disabled", value: "secret", disabled: true },
      { key: "object", value: { valid: true } },
    ],
  };
  const http = { activeEnvironment: "active", environments: [environment] };
  assert.equal(scopes.selectActiveEnvironment({ http }), environment);
  assert.deepEqual(
    JSON.parse(JSON.stringify(scopes.scopeValues(environment))),
    { zero: "0", flag: "false", empty: "", object: '{"valid":true}' },
  );
  assert.equal(
    scopes.selectActiveEnvironment({
      http: { ...http, activeEnvironment: "deleted" },
    }),
    undefined,
  );
});

test("save acknowledgements update the saved baseline without overwriting newer drafts", () => {
  const saved = {
    id: "request",
    parentId: "0",
    kind: "api",
    name: "Saved",
    sort: 0,
    request: { method: "GET", url: "https://example.com/a" },
  };
  const submitted = {
    ...saved,
    request: { ...saved.request, url: "https://example.com/b" },
  };
  const newer = {
    ...saved,
    request: { ...saved.request, url: "https://example.com/c" },
  };
  useApis.getState().updateApiOriginDetailsList([saved]);
  useApis.getState().updateApisActiveData(submitted);
  assert.equal(selectIsDirty(useApis.getState()), true);
  useApis.getState().updateApisActiveData(newer);
  useApis.getState().acknowledgeSave(submitted, submitted);
  assert.equal(useApis.getState().apisActiveData, newer);
  assert.equal(selectIsDirty(useApis.getState()), true);
  useApis.getState().acknowledgeSave(newer, newer);
  assert.equal(selectIsDirty(useApis.getState()), false);
  useApis.getState().updateApisActiveData({ ...newer, id: "new-request" });
  assert.equal(selectIsDirty(useApis.getState()), true);
});
