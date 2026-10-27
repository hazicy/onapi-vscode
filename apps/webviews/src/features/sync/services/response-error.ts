import { message } from "@/shared/ui/base";

import i18next from "i18next";

import { REPLACE_ERROR_BY_CODES } from "./constants";

export const responseError = (res: any) => {
  if (REPLACE_ERROR_BY_CODES[res?.code]) {
    return message.error(REPLACE_ERROR_BY_CODES[res.code as number]);
  }
  return message.error(
    res?.msg || res?.message || i18next.t("supplement.server_busy"),
  );
};
