# Webview browser tests

These TypeScript Playwright suites exercise browser components and built Webviews.
They do not launch VS Code. Cross-workspace Node unit and integration tests remain
in the repository's [root tests directory](../../../tests).

| Location                                | Responsibility                                                 |
| --------------------------------------- | -------------------------------------------------------------- |
| `ui/*.spec.ts`                          | UI scenarios and assertions, including production Webviews     |
| `editor/*.spec.ts`                      | CodeMirror and response-formatting scenarios and assertions    |
| `ui/pages/`, `editor/pages/`            | Page locators, navigation and reusable page operations         |
| `components/`                           | Reusable controls such as CodeMirror and portaled select menus |
| `ui/fixtures.ts`, `editor/fixtures.ts`  | Typed, test-scoped Page Object injection                       |
| `ui/*Fixture.tsx`, `editor/fixture.tsx` | Browser applications rendered by the test servers              |

Share Page Objects by the page being exercised. Native request, startup and shortcut
tests use `RequestPage`; editor and response-formatting tests use `EditorPage`.
Create a component object for controls shared across pages. Keep expected values
and assertions in specs, and browser instrumentation or race-condition setup close
to the scenario that needs it. Use Playwright's retrying locator assertions and
`expect.poll` for asynchronous state.

Import `test` from the suite's fixtures and `expect` from Playwright:

```ts
import { expect } from "@playwright/test";
import { test } from "./fixtures";

test("updates credentials", async ({ authPage }) => {
  await authPage.open();
  await authPage.setCredentials("alice", "secret");
  await expect(authPage.username).toHaveValue("alice");
});
```

The shortcut suite creates its own browser contexts to test different platforms;
instantiate `RequestPage` with that context's page instead of using the default
page fixture.

Install Chromium once with `pnpm exec playwright install chromium`. Build Webview
assets with `pnpm --dir apps/webviews build` before running the UI suite, then run:

```sh
pnpm typecheck:e2e
pnpm test:ui
pnpm test:editor
```

The Playwright configurations start and stop the local test servers. The dedicated
[TypeScript configuration](./tsconfig.json) checks specs, fixtures, Page Objects
and component objects; CI runs the same type check before browser tests.
