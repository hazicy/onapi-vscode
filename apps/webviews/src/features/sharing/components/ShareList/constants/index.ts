import i18next from "i18next";

import { Tab } from "../types";

export const SHARE_TAB_LIST: Array<Tab> = [
  {
    get label() {
      return i18next.t("docs.document.all");
    },
    key: "all",
  },
];
