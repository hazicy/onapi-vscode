// Webviews receive the editor language in their HTML before modules execute.
const browser = globalThis as typeof globalThis & {
  document?: { documentElement: { lang: string } };
  navigator?: { language: string };
};
export default browser.document
  ? browser.document.documentElement.lang || browser.navigator?.language || "en"
  : "en";
