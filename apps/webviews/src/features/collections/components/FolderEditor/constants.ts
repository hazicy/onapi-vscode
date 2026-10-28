import { FunctionComponent, lazy } from "react";

import i18next from "i18next";

const FolderParamsSettings = lazy(() => import("./Params"));
const FolderBaseSettings = lazy(() => import("./Settings"));

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
