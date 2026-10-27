import i18next from "i18next";

import { EXPORT_ENUM } from "./type";

export const EXPORT_OPTIONS = [
  {
    label: i18next.t("common.export_modal.with_desc"),
    value: EXPORT_ENUM.DESC,
  },
  {
    label: i18next.t("common.export_modal.key_value"),
    value: EXPORT_ENUM.KEY,
  },
  {
    label: i18next.t("common.export_modal.raw_json"),
    value: EXPORT_ENUM.RAW,
  },
];

export const EDIT_OPTIONS = [
  {
    label: i18next.t("common.export_modal.key_value"),
    value: EXPORT_ENUM.KEY,
  },
  {
    label: i18next.t("common.export_modal.raw_json"),
    value: EXPORT_ENUM.RAW,
  },
  {
    label: i18next.t("common.export_modal.with_desc"),
    value: EXPORT_ENUM.DESC,
  },
];

export const IMPORT_OPTIONS = [
  {
    label: i18next.t("common.import_modal.key_value"),
    value: EXPORT_ENUM.KEY,
  },
  {
    label: i18next.t("common.import_modal.raw_json"),
    value: EXPORT_ENUM.RAW,
  },
];
