import i18next from "@/shared/locale";

import Beautify from "./content/Beautify";
import Native from "./content/Native";
import Preview from "./content/Preview";
import Visualization from "./content/Visualization";

export const RAW_ENCODE: { [x: string]: string } = {
  "UTF-8": "utf8",
  GB2312: "GB2312",
  GBK: "GBK",
  GB18030: "GB18030",
  Windows936: "Windows936",
  "EUC-CN": "EUC-CN",
  "ISO-8859-1": "ISO-8859-1",
  "ISO-8859-16": "ISO-8859-16",
  cesu8: "cesu8",
  UTF7: "UTF7",
  "UTF7-IMAP": "UTF7-IMAP",
  "UTF-16": "UTF-16",
  "UTF-16BE": "UTF-16BE",
  utf16le: "utf16le",
  "UTF-32": "UTF-32",
  "UTF-32LE": "UTF-32LE",
  ascii: "ascii",
  binary: "binary",
  base64: "base64",
  hex: "hex",
  Big5: "Big5",
  "Big5-HKSCS": "Big5-HKSCS",
  Windows950: "Windows950",
  CP932: "CP932",
  CP936: "CP936",
  CP949: "CP949",
  CP950: "CP950",
};

export const RESPONSE_RESULT_TABS_LIST = [
  {
    label: i18next.t("common.response_component.pretty"),
    value: "beautify",
    children: Beautify,
  },
  {
    label: i18next.t("common.response_component.raw"),
    value: "native",
    children: Native,
  },
  {
    label: i18next.t("common.response_component.preview"),
    value: "preview",
    children: Preview,
  },
  {
    label: i18next.t("common.response_component.visualize"),
    value: "visualization",
    children: Visualization,
  },
];

export const RESPONSE_TYPE = [
  {
    label: "JSON",
    ext: "json",
    mine: "application/json",
  },
  {
    label: "XML",
    ext: "xml",
    mine: "application/xml",
  },
  {
    label: "HTML",
    ext: "html",
    mine: "text/html",
  },
  {
    label: "Text",
    ext: "text",
    mine: "text/html",
  },
  {
    label: "Auto",
    ext: "auto",
    mine: "application/json",
  },
];
