import { test } from "node:test";
import assert from "node:assert/strict";
import load, { nativeDependency } from "../helpers/loadTypeScript.mjs";
const variables = await load(
  "apps/webviews/src/features/requests/editor/Request/Auth/oauth2-variables.ts",
  nativeDependency,
);
const api = await load(
  "apps/webviews/src/features/requests/editor/Request/Auth/oauth2-token-request.ts",
  (id) => (id === "./oauth2-variables" ? variables : nativeDependency(id)),
);
const plain = (value) => JSON.parse(JSON.stringify(value));
const row = (key, value, send_as = "request_body") => ({
  key,
  value,
  send_as,
  enabled: true,
  param_id: key,
});

test("token requests keep custom body/query/header routing and standard field precedence", () => {
  const settings = {
    clientId: "client",
    clientSecret: "secret",
    username: "alice",
    password: "password",
    grant_type: "password_credentials",
    accessTokenUrl: "https://example.test/token",
    tokenRequestParams: [
      row("extra", "first"),
      row("extra", "last"),
      row("client_id", "overridden"),
      row("tenant", "dev", "request_url"),
      row("X-Client", "test", "header"),
    ],
  };
  const original = structuredClone(settings);
  assert.deepEqual(plain(api.buildOAuth2TokenRequest(settings)), {
    url: "https://example.test/token",
    data: {
      extra: "last",
      client_id: "client",
      client_secret: "secret",
      grant_type: "password",
      username: "alice",
      password: "password",
    },
    headers: {
      "X-Client": "test",
      "Content-Type": "application/x-www-form-urlencoded",
    },
    options: { params: { tenant: "dev" } },
  });
  assert.deepEqual(settings, original);
});

test("authorization code and PKCE requests keep grant mapping and callback fields", () => {
  const request = api.buildOAuth2TokenRequest(
    {
      grant_type: "authorization_code_with_pkce",
      code_verifier: "verifier",
      redirect_uri: "https://example.test/callback",
    },
    { code: "code", state: "state" },
  );
  assert.equal(request.data.grant_type, "authorization_code");
  assert.equal(request.data.code_verifier, "verifier");
  assert.equal(request.data.code, "code");
  assert.equal(request.data.state, "state");
  assert.equal(request.data.redirect_uri, "https://example.test/callback");
  assert.equal(
    api.buildOAuth2TokenRequest({ grant_type: "unknown" }).data.grant_type,
    undefined,
  );
});

test("refresh requests keep token placement and independent refresh parameters", () => {
  const request = api.buildOAuth2RefreshRequest(
    {
      clientId: "client",
      refreshTokenUrl: "https://example.test/refresh",
      refreshRequestParams: [
        row("grant_type", "refresh_token"),
        row("refresh_token", "custom"),
        row("tenant", "dev", "request_url"),
      ],
    },
    "stored-refresh-token",
  );
  assert.equal(request.data.refresh_token, "stored-refresh-token");
  assert.equal(request.data.grant_type, "refresh_token");
  assert.equal(request.url, "https://example.test/refresh");
  assert.equal(request.options.params.tenant, "dev");
});

test("variable resolution creates execution snapshots and missing variables reject before dispatch", async () => {
  const settings = {
    clientId: "{{client}}",
    accessTokenUrl: "{{base}}/token",
    username: "{{user}}",
    grant_type: "password_credentials",
    tokenRequestParams: [row("{{key}}", "{{value}}")],
    refreshTokenUrl: "{{base}}/refresh",
    refreshRequestParams: [row("extra", "{{value}}")],
    redirect_uri: "{{base}}/callback",
  };
  const original = structuredClone(settings);
  const scope = {
    client: "resolved",
    base: "https://example.test",
    user: "alice",
    key: "extra",
    value: "value",
  };
  const token = await api.resolveOAuth2TokenSettings(settings, scope);
  assert.equal(token.clientId, "resolved");
  assert.equal(token.accessTokenUrl, "https://example.test/token");
  assert.equal(token.tokenRequestParams[0].key, "extra");
  const refresh = await api.resolveOAuth2RefreshSettings(settings, scope);
  assert.equal(refresh.redirect_uri, "https://example.test/callback");
  assert.equal(refresh.refreshTokenUrl, "https://example.test/refresh");
  await assert.rejects(
    api.resolveOAuth2TokenSettings(settings, {}),
    (error) => error === "client",
  );
  assert.deepEqual(settings, original);
});
