import { FunctionComponent, lazy } from "react";

import i18next from "i18next";

const FolderParamsSettings = lazy(() => import("./Params"));
const FolderBaseSettings = lazy(() => import("./Settings"));

export const GUEST_API_SAMPLE = "sample";
export const GUEST_API_MOCK = "mock";
export const GUEST_FOLDER_API_MANAGE = "api_manage";

export const APIS_CONTENT_MAP: {
  [key: string]:
    | FunctionComponent<{ apisData: any; onApisDataChange: any }>
    | {
        value: string;
        label: string;
        children: FunctionComponent<{ apisData: any; onApisDataChange: any }>;
      }[];
} = {
  folder: [
    {
      value: "settings",
      label: i18next.t("folder.folder_setting.title"),
      children: FolderBaseSettings,
    },
    {
      value: "folder_params",
      label: i18next.t("folder.folder_param"),
      children: FolderParamsSettings,
    },
  ],
};
