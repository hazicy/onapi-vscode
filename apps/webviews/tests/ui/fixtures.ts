import { WebSocketPage } from "./pages/WebSocketPage";
import { ThemePage } from "./pages/ThemePage";
import { test as base } from "@playwright/test";
import { AuthPage } from "./pages/AuthPage";
import { AutocompletePage } from "./pages/AutocompletePage";
import { BaseComponentsPage } from "./pages/BaseComponentsPage";
import { BodyPage } from "./pages/BodyPage";
import { DataPage } from "./pages/DataPage";
import { DescriptionPage } from "./pages/DescriptionPage";
import { DrawerPage } from "./pages/DrawerPage";
import { FiltersPage } from "./pages/FiltersPage";
import { ResizePage } from "./pages/ResizePage";
import { VariableInsertPage } from "./pages/VariableInsertPage";
import { WebviewsPage } from "./pages/WebviewsPage";

import { RequestPage } from "./pages/RequestPage";

type Pages = {
  webSocketPage: WebSocketPage;
  themePage: ThemePage;
  requestPage: RequestPage;
  authPage: AuthPage;
  autocompletePage: AutocompletePage;
  basePage: BaseComponentsPage;
  bodyPage: BodyPage;
  dataPage: DataPage;
  descriptionPage: DescriptionPage;
  drawerPage: DrawerPage;
  filtersPage: FiltersPage;
  resizePage: ResizePage;
  variableInsertPage: VariableInsertPage;
  webviewsPage: WebviewsPage;
};

export const test = base.extend<Pages>({
  webSocketPage: async ({ page }, use) => {
    await use(new WebSocketPage(page));
  },
  themePage: async ({ page }, use) => {
    await use(new ThemePage(page));
  },
  requestPage: async ({ page }, use) => {
    await use(new RequestPage(page));
  },
  authPage: async ({ page }, use) => {
    await use(new AuthPage(page));
  },
  autocompletePage: async ({ page }, use) => {
    await use(new AutocompletePage(page));
  },
  basePage: async ({ page }, use) => {
    await use(new BaseComponentsPage(page));
  },
  bodyPage: async ({ page }, use) => {
    await use(new BodyPage(page));
  },
  dataPage: async ({ page }, use) => {
    await use(new DataPage(page));
  },
  descriptionPage: async ({ page }, use) => {
    await use(new DescriptionPage(page));
  },
  drawerPage: async ({ page }, use) => {
    await use(new DrawerPage(page));
  },
  filtersPage: async ({ page }, use) => {
    await use(new FiltersPage(page));
  },
  resizePage: async ({ page }, use) => {
    await use(new ResizePage(page));
  },
  variableInsertPage: async ({ page }, use) => {
    await use(new VariableInsertPage(page));
  },
  webviewsPage: async ({ page }, use) => {
    await use(new WebviewsPage(page));
  },
});
