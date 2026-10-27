import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: ".",
  testMatch: "*.spec.ts",
  workers: 1,
  outputDir: "../../../../test-results/ui",
  use: {
    browserName: "chromium",
    baseURL: "http://127.0.0.1:4179",
    headless: true,
  },
  webServer: [
    {
      command: "pnpm vite --config apps/webviews/tests/ui/vite.config.mts",
      cwd: "../../../..",
      url: "http://127.0.0.1:4179",
      reuseExistingServer: false,
    },
    {
      command:
        "pnpm --dir apps/webviews exec vite preview --host 127.0.0.1 --port 4180 --strictPort",
      cwd: "../../../..",
      url: "http://127.0.0.1:4180/webviews.css",
      reuseExistingServer: false,
    },
  ],
});
