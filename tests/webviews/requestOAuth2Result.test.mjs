import { test } from "node:test";
import assert from "node:assert/strict";
import load, { nativeDependency } from "../helpers/loadTypeScript.mjs";
const auth = await load(
  "apps/webviews/src/features/requests/editor/Request/Auth/auth-state.ts",
);
async function fixture() {
  let activeRequest = {
    id: "request",
    kind: "api",
    name: "Request",
    request: {
      url: "https://example.test",
      auth: {
        type: "oauth2",
        oauth2: [
          { key: "clientId", value: "client" },
          { key: "scope", value: "read" },
        ],
        basic: [{ key: "username", value: "sibling" }],
      },
    },
  };
  let cache = {};
  const notifications = [];
  const { useRequestOAuth2Result } = await load(
    "apps/webviews/src/features/requests/editor/Request/Auth/useRequestOAuth2Result.ts",
    (id) => {
      if (id === "./auth-state") return auth;
      if (id === "react-i18next")
        return { useTranslation: () => ({ t: (key) => key }) };
      if (id === "@/shared/ui/base")
        return {
          message: {
            success: (text) => notifications.push(text),
            error: (text) => notifications.push(text),
          },
        };
      if (id.endsWith("useRequestWorkspaceStore"))
        return {
          default: {
            getState: () => ({
              activeRequest,
              setActiveRequest: (next) => {
                activeRequest = next;
              },
            }),
          },
        };
      if (id.endsWith("useUserConfig"))
        return { default: { getState: () => ({ userInfo: { uid: "user" } }) } };
      if (id === "@/app/store")
        return {
          useStorage: {
            getState: () => ({
              oauthRefreshData: cache,
              updateOauthRefreshData: (next) => {
                cache = next;
              },
            }),
          },
        };
      return nativeDependency(id);
    },
  );
  return {
    ...useRequestOAuth2Result(),
    request: () => activeRequest,
    cache: () => cache,
    notifications,
  };
}

test("OAuth token results update the auth attribute list and cache refresh data by client ID", async () => {
  const f = await fixture();
  const original = f.request();
  const snapshot = structuredClone(original);
  f.handleProxyFetchResult({
    code: 200,
    data: { access_token: "access", refresh_token: "refresh" },
  });
  assert.equal(
    auth.readAuthValues(f.request().request.auth, "oauth2").access_token,
    "access",
  );
  assert.equal(
    auth.readAuthValues(f.request().request.auth, "oauth2").scope,
    "read",
  );
  assert.deepEqual(
    JSON.parse(JSON.stringify(f.request().request.auth.basic)),
    original.request.auth.basic,
  );
  assert.equal(f.cache().user.client.refresh_token, "refresh");
  assert.deepEqual(original, snapshot);
});

test("failed or malformed token responses preserve the current draft and refresh cache", async () => {
  const f = await fixture();
  const original = f.request();
  f.handleProxyFetchResult({ code: 401, error: "unauthorized" });
  f.handleProxyFetchResult({ code: 200, data: [] });
  f.handleProxyFetchResult({ code: 200, data: { message: "no token" } });
  assert.equal(f.request(), original);
  assert.deepEqual(f.cache(), {});
  assert.equal(f.notifications.length, 3);
});
