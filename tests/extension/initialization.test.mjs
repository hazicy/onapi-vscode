import { test } from "node:test";
import assert from "node:assert/strict";
import load, { nativeDependency } from "../helpers/loadTypeScript.mjs";

test("initialization does not inspect old account data or repair old parameter IDs", async () => {
  const request = {
    request: { header: { parameter: [{ key: "name", value: "value" }] } },
  };
  let saves = 0;
  const updates = [];
  const api = await load("apps/extension/src/app/initialize.ts", (id) => {
    if (id === "lodash") return nativeDependency(id);
    if (id.endsWith("requests/constants/default"))
      return { INIT_DEFAULT_API_DATAS: [] };
    if (id.endsWith("utils/data-tools")) return { snowflakeId: () => "new-id" };
    if (id.endsWith("/host-utils"))
      return {
        getVscodeFontFamily: () => "monospace",
        getVscodeFontSize: () => 14,
      };
    if (id.endsWith("/request-storage"))
      return { getApiList: () => [request], setApiList: () => saves++ };
    return {};
  });
  await api.initializePlugin({
    globalState: {
      get: (key) => {
        assert.notEqual(key, "userConfig", "Account migration must not run");
        return key === "extensionConfig" ? { firstInit: true } : {};
      },
      update: async (key, value) => updates.push([key, value]),
    },
  });
  assert.equal(saves, 0);
  assert.equal(request.request.header.parameter[0].param_id, undefined);
  assert.ok(updates.every(([key]) => key !== "userConfig"));
  assert.equal(
    updates.find(([key]) => key === "extensionConfig")[1].firstFullData,
    undefined,
  );
});
