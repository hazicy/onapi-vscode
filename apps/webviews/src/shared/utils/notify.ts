import i18next from "i18next";
import { message } from "@/shared/ui/base";

export const catchError = (error: any, errorText?: string) => {
  if (error) {
    return message.error(error?.msg || error?.message || `${error}`);
  }

  return message.error(errorText || i18next.t("supplement.catch_err"));
};
