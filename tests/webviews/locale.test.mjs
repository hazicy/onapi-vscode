import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import load, { nativeDependency } from "../helpers/loadTypeScript.mjs";

const en = JSON.parse(
  fs.readFileSync(
    new URL("../../packages/domain/src/locale/en_US.json", import.meta.url),
    "utf8",
  ),
);
const zh = JSON.parse(
  fs.readFileSync(
    new URL("../../packages/domain/src/locale/zh_CN.json", import.meta.url),
    "utf8",
  ),
);
const flatten = (value, prefix = "") =>
  Object.fromEntries(
    Object.entries(value).flatMap(([key, entry]) =>
      typeof entry === "object" && entry !== null
        ? Object.entries(flatten(entry, `${prefix}${key}.`))
        : [[`${prefix}${key}`, entry]],
    ),
  );

test("Chinese and English catalogs have matching nonempty translation keys", () => {
  const english = flatten(en),
    chinese = flatten(zh);
  assert.deepEqual(Object.keys(english).sort(), Object.keys(chinese).sort());
  for (const [key, value] of Object.entries(english)) {
    assert.equal(typeof value, "string", key);
    assert.ok(value.trim(), key);
    assert.ok(chinese[key].trim(), key);
  }
});

test("new UI translations preserve interpolation arguments in both languages", () => {
  const variables = (text) =>
    [...text.matchAll(/{{\s*([^}]+?)\s*}}/g)].map((match) => match[1]).sort();
  for (const key of Object.keys(en.ui))
    assert.deepEqual(variables(en.ui[key]), variables(zh.ui[key]), key);
});

test("counts, literal variable examples and response terminology render correctly", async () => {
  const i18next = await nativeDependency("i18next");
  const locale = i18next.createInstance();
  await locale.init({
    lng: "zh-cn",
    lowerCaseLng: true,
    resources: { en: { translation: en }, "zh-cn": { translation: zh } },
    interpolation: { escapeValue: false },
  });
  assert.equal(locale.t("ui.grpc_received", { count: 3 }), "已接收 3 条消息");
  assert.equal(
    locale.t("ui.grpc_loaded", { services: 2, methods: 5 }),
    "已加载 2 个服务、5 个方法",
  );
  assert.equal(
    locale.t("ui.value_or_variable", { variable: "{{variable}}" }),
    "值或 {{variable}}",
  );
  assert.equal(locale.t("api.run.response_tab"), "响应体");
  await locale.changeLanguage("en");
  assert.equal(locale.t("api.run.response_tab"), "Response");
  assert.equal(
    locale.t("ui.grpc_received", { count: 3 }),
    "3 messages received",
  );
});

test("auth option labels follow the active language without changing protocol values", async () => {
  const i18next = await nativeDependency("i18next");
  const locale = i18next.createInstance();
  await locale.init({
    lng: "zh-cn",
    lowerCaseLng: true,
    resources: { en: { translation: en }, "zh-cn": { translation: zh } },
  });
  const auth = await load(
    "packages/domain/src/requests/constants/auth.ts",
    (id) => {
      if (id === "i18next") return locale;
      throw new Error(`Unexpected dependency ${id}`);
    },
  );
  assert.equal(auth.AUTH_APIKEY_LOCATION[0].label, "请求头");
  assert.equal(auth.AUTH_APIKEY_LOCATION[0].value, "header");
  assert.equal(auth.AUTH_OAUTH2_SEND_IN[0].label, "请求体");
  assert.equal(auth.AUTH_OAUTH2_SEND_IN[0].value, "request_body");
  await locale.changeLanguage("en");
  assert.equal(auth.AUTH_APIKEY_LOCATION[0].label, "Request Header");
  assert.equal(auth.AUTH_OAUTH2_SEND_IN[0].label, "Request Body");
  assert.equal(auth.AUTH_APIKEY_LOCATION[0].value, "header");
});

test("literal translation references point to existing catalog entries", () => {
  const english = flatten(en);
  const walk = (directory) =>
    fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
      const url = new URL(
        entry.name + (entry.isDirectory() ? "/" : ""),
        directory,
      );
      return entry.isDirectory()
        ? walk(url)
        : /\.tsx?$/.test(entry.name)
          ? [url]
          : [];
    });
  for (const directory of [
    "apps/webviews/src/",
    "apps/extension/src/",
    "packages/domain/src/",
  ]) {
    for (const file of walk(new URL(`../../${directory}`, import.meta.url))) {
      const source = fs.readFileSync(file, "utf8");
      for (const [, key] of source.matchAll(
        /\bt\(\s*["']([a-zA-Z_][\w.]+)["']/g,
      )) {
        assert.ok(
          Object.hasOwn(english, key),
          `${file.pathname}: missing ${key}`,
        );
      }
    }
  }
});
