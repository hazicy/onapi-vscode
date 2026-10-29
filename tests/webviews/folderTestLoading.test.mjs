import { test } from "node:test";
import assert from "node:assert/strict";
import load from "../helpers/loadTypeScript.mjs";

test("folder test bootstrap delivers its name and initializes run state", async () => {
  const messages = [];
  const { handelFolderTestMessage } = await load(
    "apps/extension/src/features/testing/folder-test-handler.ts",
    (id) => {
      if (id === "vscode") return {};
      if (id.endsWith("/http-runner"))
        return {
          stopWorker() {},
        };
      if (id.endsWith("/project-config"))
        return { getCurrentProjectConfig() {} };
      if (id === "./folder-test-data")
        return {
          getFolderTestPageData: () => ({
            eventList: [],
            config: {},
            reportList: [],
          }),
        };
      if (id === "./folder-test-runner") return { runFolderTest() {} };
      if (id === "./report-storage")
        return {
          setTestingFolderData() {},
        };
      throw new Error(id);
    },
  );
  const panel = {
    webview: { postMessage: (message) => messages.push(message) },
  };
  for (const name of ["API tests", ""]) {
    await handelFolderTestMessage(
      { action: "getTestData" },
      {},
      panel,
      { id: "folder", name },
      false,
    );
    const { data } = messages.at(-1);
    assert.equal(data.testingName, name || "Test Folder");
    assert.equal(data.isInit, true);
  }
  await handelFolderTestMessage(
    { action: "refreshEventList" },
    {},
    panel,
    { id: "folder", name: "API tests" },
    false,
  );
  assert.equal(messages.at(-1).data.isInit, false);
});

for (const payload of [{ testingName: "API tests" }, {}]) {
  test(`folder test receives immediate bootstrap responses (${JSON.stringify(payload)})`, async () => {
    const effects = [];
    let listener;
    let loaded = false;
    let name;
    let initialized;
    let saved = 0;
    const state = {
      testingSendingData: {},
      updateTestingName: (value) => {
        name = value;
      },
      updateTestingSendingData: (value) => {
        initialized = value;
        state.testingSendingData = value;
      },
      updateShowReportList() {},
    };
    const store = (selector) => selector(state);
    store.getState = () => state;
    await load(
      "apps/webviews/src/app/webviews/FolderTestPanel.tsx",
      (id) => {
        if (id === "react")
          return {
            useEffect: (effect) => effects.push(effect),
            useState: () => [
              loaded,
              (value) => {
                loaded = value;
              },
            ],
          };
        if (id === "react/jsx-runtime")
          return {
            jsx: (type, props) => ({ type, props }),
            jsxs: (type, props) => ({ type, props }),
          };
        if (id === "react-dom/client")
          return {
            createRoot: () => ({ render: (element) => element.type() }),
          };
        if (
          id.endsWith("/useTesting") ||
          id.endsWith("/useProjectConfig") ||
          id === "@/app/store"
        )
          return { default: store, useGlobal: store };
        if (id.endsWith("/useGlobalTheme")) return { default: () => ({}) };
        if (id === "immer")
          return {
            produce: (value, recipe) => {
              const draft = structuredClone(value);
              recipe(draft);
              return draft;
            },
          };
        if (id.endsWith("/utils"))
          return {
            saveReport() {
              saved++;
            },
          };
        if (id === "@/shared/ui/base") return { App() {}, Skeleton() {} };
        if (id.endsWith("/Theme")) return { ThemeProvider() {} };
        return { default() {} };
      },
      {
        document: { getElementById: () => ({}) },
        window: {
          addEventListener: (_, callback) => {
            listener = callback;
          },
          removeEventListener() {},
          vscode: {
            postMessage: ({ action }) => {
              if (action === "getTestData") {
                assert.equal(typeof listener, "function");
                listener({
                  data: {
                    action: "setTestData",
                    data: { ...payload, isInit: true },
                  },
                });
              }
            },
          },
        },
      },
    );
    for (const effect of effects) effect();
    assert.equal(loaded, true);
    assert.equal(name, payload.testingName || "Test Folder");
    assert.equal(initialized.sendStatus, "initial");
    state.testingSendingData = {
      sendStatus: "sending",
      events: [],
      startedAt: 1,
    };
    const request = {
      type: "request",
      cursor: { iteration: 0, position: 0 },
      request: { method: "GET", url: "https://example.com" },
    };
    const assertion = { type: "assertion", assertions: [{ assertion: "OK" }] };
    for (const event of [request, assertion, { type: "done" }]) {
      await listener({ data: { action: "folderTestEvent", data: event } });
    }
    assert.equal(initialized.events.length, 3);
    assert.equal(initialized.events[0], request);
    assert.equal(initialized.events[1], assertion);
    assert.equal(initialized.sendStatus, "sendOver");
    assert.equal(typeof initialized.finishedAt, "number");
    assert.equal(saved, 1);
    await listener({
      data: { action: "folderTestEvent", data: { type: "done" } },
    });
    assert.equal(saved, 1);
  });
}
