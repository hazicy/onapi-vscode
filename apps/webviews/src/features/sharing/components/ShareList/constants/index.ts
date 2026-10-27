import i18next from "i18next";

import { Tab } from "../types";

export const SHARE_TAB_LIST: Array<Tab> = [
  {
    label: i18next.t("docs.document.all"),
    key: "all",
  },
];
export const Archive_TAB_LIST: Array<Tab> = [
  {
    label: i18next.t("docs.document.all"),
    key: "all",
  },
  {
    label: "HTTP",
    key: "api",
  },
  {
    label: "SSE",
    key: "sse",
  },
  {
    label: i18next.t("common.kind.doc"),
    key: "doc",
  },

  {
    label: "TCP",
    key: ["socket_method", "socket"],
  },
];

export const TABS_LISTS: {
  [key: string]: Array<Tab>;
} = {
  share: SHARE_TAB_LIST,
  archive: Archive_TAB_LIST,
};
