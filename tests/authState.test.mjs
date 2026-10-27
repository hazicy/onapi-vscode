import { test } from "node:test";
import assert from "node:assert/strict";
import load from "./helpers/loadTypeScript.mjs";
const { readAuthValues, updateAuthValues, validateOAuth2 } = await load(
  "apps/webviews/src/features/requests/components/Request/Auth/authState.ts",
);
const plain = (value) => JSON.parse(JSON.stringify(value));

test("auth edits preserve sibling fields and protocols without mutating source", () => {
  const auth = {
    type: "basic",
    basic: [
      { key: "username", value: "alice" },
      { key: "password", value: "secret" },
    ],
    bearer: [{ key: "token", value: "token" }],
  };
  const snapshot = structuredClone(auth);
  const next = updateAuthValues(auth, "basic", { username: "bob" });
  assert.deepEqual(plain(readAuthValues(next, "basic")), {
    username: "bob",
    password: "secret",
  });
  assert.deepEqual(plain(next.bearer), auth.bearer);
  assert.deepEqual(auth, snapshot);
});

test("native auth edits preserve attribute metadata and supply defaults to token operations", () => {
  const auth = {
    type: "oauth2",
    oauth2: [{ key: "clientId", value: "old", type: "string", custom: true }],
  };
  const next = updateAuthValues(auth, "oauth2", {
    clientId: "new",
    access_token: "token",
  });
  const values = readAuthValues(next, "oauth2");
  assert.equal(values.clientId, "new");
  assert.equal(values.access_token, "token");
  assert.equal(values.grant_type, "password_credentials");
  assert.equal(
    next.oauth2.find((item) => item.key === "clientId").custom,
    true,
  );
  assert.equal(next.oauth2.filter((item) => item.key === "clientId").length, 1);
  assert.equal(auth.oauth2[0].value, "old");
});

test("defaults retain explicit false and empty values and do not leak across requests", () => {
  assert.equal(readAuthValues(undefined, "apikey").in, "header");
  assert.equal(readAuthValues(undefined, "jwt").addTokenTo, "header");
  assert.equal(
    readAuthValues(
      { oauth1: [{ key: "addParamsToHeader", value: false }] },
      "oauth1",
    ).addParamsToHeader,
    false,
  );
  assert.equal(
    readAuthValues({ oauth2: [{ key: "headerPrefix", value: "" }] }, "oauth2")
      .headerPrefix,
    "",
  );
  updateAuthValues(undefined, "oauth2", { clientId: "one" });
  assert.equal(readAuthValues(undefined, "oauth2").clientId, undefined);
});

test("OAuth2 validation follows visible grant fields and rejects whitespace", () => {
  const password = {
    grant_type: "password_credentials",
    accessTokenUrl: "{{url}}",
    username: "alice",
    password: "secret",
  };
  assert.deepEqual(plain(validateOAuth2(password)), {});
  assert.deepEqual(
    Object.keys(validateOAuth2({ ...password, username: " " })),
    ["username"],
  );
  const client = {
    grant_type: "client_credentials",
    accessTokenUrl: "https://example.com/token",
    clientId: "id",
    clientSecret: "secret",
  };
  assert.deepEqual(plain(validateOAuth2(client)), {});
  assert.deepEqual(
    plain(
      validateOAuth2({
        grant_type: "implicit",
        redirect_uri: "https://example.com",
        authUrl: "https://example.com/auth",
        clientId: "id",
      }),
    ),
    {},
  );
  assert.deepEqual(
    Object.keys(validateOAuth2({ grant_type: "authorization_code" })).sort(),
    [
      "accessTokenUrl",
      "authUrl",
      "clientId",
      "clientSecret",
      "redirect_uri",
    ].sort(),
  );
});
