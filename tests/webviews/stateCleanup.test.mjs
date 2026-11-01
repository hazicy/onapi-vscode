import { test } from "node:test";
import assert from "node:assert/strict";
import load, { nativeDependency } from "../helpers/loadTypeScript.mjs";

const zustand = await nativeDependency("zustand");
const {
  default: useRequestWorkspaceStore,
  selectRequestIndex,
  selectIsDirty,
} = await load(
  "apps/webviews/src/features/requests/store/useRequestWorkspaceStore.ts",
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
  useRequestWorkspaceStore.getState().setSavedRequests([first]);
  const index = selectRequestIndex(useRequestWorkspaceStore.getState());
  assert.equal(index.one, first);
  assert.equal(selectRequestIndex(useRequestWorkspaceStore.getState()), index);
  useRequestWorkspaceStore
    .getState()
    .setSavedRequests([{ id: "two", name: "New" }]);
  const replacement = selectRequestIndex(useRequestWorkspaceStore.getState());
  assert.equal(replacement.one, undefined);
  assert.equal(replacement.two.name, "New");
  const execution = {
    result: { response: { code: 200 } },
    consoleList: [{ messages: ["log"] }],
  };
  useRequestWorkspaceStore.getState().setHttpExecution(execution);
  useRequestWorkspaceStore.getState().clearConsole();
  assert.equal(
    useRequestWorkspaceStore.getState().httpExecution.result.response,
    execution.result.response,
  );
  assert.equal(
    useRequestWorkspaceStore.getState().httpExecution.consoleList.length,
    0,
  );
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
  useRequestWorkspaceStore.getState().setSavedRequests([saved]);
  useRequestWorkspaceStore.getState().setActiveRequest(submitted);
  assert.equal(selectIsDirty(useRequestWorkspaceStore.getState()), true);
  useRequestWorkspaceStore.getState().setActiveRequest(newer);
  useRequestWorkspaceStore.getState().acknowledgeSave(submitted, submitted);
  assert.equal(useRequestWorkspaceStore.getState().activeRequest, newer);
  assert.equal(selectIsDirty(useRequestWorkspaceStore.getState()), true);
  useRequestWorkspaceStore.getState().acknowledgeSave(newer, newer);
  assert.equal(selectIsDirty(useRequestWorkspaceStore.getState()), false);
  useRequestWorkspaceStore
    .getState()
    .setActiveRequest({ ...newer, id: "new-request" });
  assert.equal(selectIsDirty(useRequestWorkspaceStore.getState()), true);
});
