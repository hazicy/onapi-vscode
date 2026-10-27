import assert from "node:assert/strict";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import esbuild from "esbuild";

const root = path.resolve(fileURLToPath(new URL(".", import.meta.url)), "..");
function bundle(host, language = "auto") {
  return esbuild.buildSync({
    absWorkingDir: root,
    entryPoints: [
      host
        ? "apps/extension/src/platform/locale/index.ts"
        : "apps/webviews/src/shared/locale/index.ts",
    ],
    bundle: true,
    write: false,
    platform: "node",
    format: "esm",
    external: ["vscode"],
    alias: {
      "@": path.join(root, "apps/webviews/src"),
      ...(host
        ? {
            "@/shared/locale/runtime": path.join(
              root,
              "apps/extension/src/platform/locale/language.ts",
            ),
          }
        : {}),
    },
    define: {
      __ONAPI_LANGUAGE__: JSON.stringify(language),
      "process.env.NODE_ENV": '"production"',
    },
  }).outputFiles[0].text;
}

async function load(
  code,
  hostLanguage,
  htmlLanguage = hostLanguage,
  browserLanguage = "en",
) {
  const vscode =
    "data:text/javascript," +
    encodeURIComponent(
      `export const env = { language: ${JSON.stringify(hostLanguage)} };`,
    );
  const globals = `const document = { documentElement: { lang: ${JSON.stringify(htmlLanguage)} } }; const navigator = { language: ${JSON.stringify(browserLanguage)} };\n`;
  const source =
    globals + code.replace(/(['"])vscode\1/g, JSON.stringify(vscode));
  return (
    await import(
      "data:text/javascript;base64," + Buffer.from(source).toString("base64")
    )
  ).default;
}

async function main() {
  const host = bundle(true);
  const webview = bundle(false);
  for (const [locale, expected] of [
    ["en", "en"],
    ["en-US", "en"],
    ["zh-CN", "zh-cn"],
    ["zh-cn", "zh-cn"],
    ["zh-Hans", "zh-cn"],
    ["zh-SG", "zh-cn"],
    ["zh-TW", "en"],
    ["fr", "en"],
  ]) {
    for (const code of [host, webview]) {
      const i18n = await load(code, locale);
      assert.equal(i18n.isInitialized, true);
      assert.equal(i18n.language, expected);
      assert.equal(
        i18n.t("root"),
        i18n.getResource(expected, "translation", "root"),
      );
    }
  }
  assert.equal((await load(webview, "en", "zh-cn", "en")).language, "zh-cn");
  assert.equal((await load(webview, "en", "", "zh-CN")).language, "zh-cn");
  assert.equal((await load(bundle(true, "en"), "zh-cn")).language, "en");
  assert.equal((await load(bundle(false, "zh-cn"), "en")).language, "zh-cn");

  const manifest = JSON.parse(
    fs.readFileSync(
      new URL("../apps/extension/package.json", import.meta.url),
      "utf8",
    ),
  );
  const english = JSON.parse(
    fs.readFileSync(
      new URL("../apps/extension/package.nls.json", import.meta.url),
      "utf8",
    ),
  );
  const chinese = JSON.parse(
    fs.readFileSync(
      new URL("../apps/extension/package.nls.zh-cn.json", import.meta.url),
      "utf8",
    ),
  );
  for (const [, key] of JSON.stringify(manifest.contributes).matchAll(
    /%([^%]+)%/g,
  )) {
    assert.ok(english[key], `Missing English manifest translation: ${key}`);
    assert.ok(chinese[key], `Missing Chinese manifest translation: ${key}`);
  }
  console.log(
    "Localization checks passed: editor language, Webview language, fallback, overrides, and manifest translations.",
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
