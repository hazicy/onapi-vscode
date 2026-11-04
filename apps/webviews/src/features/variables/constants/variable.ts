/* eslint-disable quotes */
import i18next from "i18next";

import { InnerFuncListItem } from "@onapi/domain/requests/types/variable";

const { t } = i18next;

export enum VARIABLE_TABS_VALUE {
  value,
  desc,
}

export enum ASSIGNMENT_VALUE_KEY {
  fixed = "fixed",
  random = "random",
}

export enum MOCK_TABS_KEY {
  faker = "faker",
}

export enum VAR_OPTIONS_KEY {
  var = "var",
  mock = "mock",
  fixed = "fixed",
  ai_value = "aiValue",
  desc = "desc",
  ai_desc = "aiDesc",
}

export const VAR_OPTIONS_LIST = [
  {
    label: t("var_insert.quote_var"),
    desc: t("var_insert.quote_var_desc"),
    key: VAR_OPTIONS_KEY.var,
    icon: "variable",
  },
  {
    label: t("var_insert.mock_data"),
    desc: t("var_insert.mock_data_desc"),
    key: VAR_OPTIONS_KEY.mock,
    icon: "flask-conical",
  },
  {
    label: t("var_insert.fixed_value"),
    desc: t("var_insert.fixed_value_desc"),
    key: VAR_OPTIONS_KEY.fixed,
    icon: "text-cursor-input",
  },
];

export const DESC_OPTIONS_LIST = [
  {
    label: t("settings.description.title"),
    desc: t("var_insert.des_desc"),
    key: VAR_OPTIONS_KEY.desc,
    icon: "list-filter",
  },
];

export const FUNCTION_DEFAULT_VALUE = {
  substr: {
    start: 0,
    length: undefined,
  },
  sha: {
    text: "sha1",
  },
  concat: {
    text: "",
  },
  lconcat: {
    text: "",
  },
  padStart: {
    length: 0,
    text: "",
  },
  padEnd: {
    length: 0,
    text: "",
  },
};

export const INNER_FUNC_LIST: InnerFuncListItem[] = [
  {
    function: "md5",
    description: t("var_insert.fn_list.md5"),
  },
  {
    function: "lower",
    description: t("var_insert.fn_list.lower"),
  },
  {
    function: "length",
    description: t("var_insert.fn_list.length"),
  },
  {
    function: "substr",
    description: t("var_insert.fn_list.substr"),
    params: [
      {
        type: "number",
        default: 0,
        key: "start",
        placeholder: t("var_insert.substr_start"),
      },
      {
        type: "number",
        default: undefined,
        key: "length",
        placeholder: t("var_insert.substr_length"),
      },
    ],
  },
  {
    function: "sha",
    description: t("var_insert.fn_list.sha"),
    params: [
      {
        type: "option",
        default: "sha1",
        options: [
          { value: "sha1", label: "sha1" },
          { value: "sha224", label: "sha224" },
          { value: "sha256", label: "sha256" },
          { value: "sha384", label: "sha384" },
          { value: "sha512", label: "sha512" },
        ],
      },
    ],
  },
  {
    function: "base64",
    description: t("var_insert.fn_list.base64"),
  },
  {
    function: "unbase64",
    description: t("var_insert.fn_list.unbase64"),
  },
  {
    function: "encodeURIComponent",
    description: t("var_insert.fn_list.encode"),
  },
  {
    function: "decodeURIComponent",
    description: t("var_insert.fn_list.decode"),
  },
  {
    function: "concat",
    description: t("var_insert.fn_list.concat"),
    params: [
      {
        type: "string",
        default: "",
        placeholder: t("var_insert.concat"),
      },
    ],
  },
  {
    function: "lconcat",
    description: t("var_insert.fn_list.lconcat"),
    params: [
      {
        type: "string",
        default: "",
        placeholder: t("var_insert.lconcat"),
      },
    ],
  },
  {
    function: "upper",
    description: t("var_insert.fn_list.upper"),
  },
  {
    function: "number",
    description: t("var_insert.fn_list.number"),
  },
  {
    function: "padStart",
    description: t("var_insert.fn_list.padStart"),
    params: [
      {
        type: "number",
        default: 0,
        key: "length",
        placeholder: t("var_insert.padStart_length"),
      },
      {
        type: "string",
        default: "",
        key: "text",
        placeholder: t("var_insert.padStart_string"),
      },
    ],
  },
  {
    function: "padEnd",
    description: t("var_insert.fn_list.padEnd"),
    params: [
      {
        type: "number",
        default: 0,
        key: "length",
        placeholder: t("var_insert.padEnd_length"),
      },
      {
        type: "string",
        default: "",
        key: "text",
        placeholder: t("var_insert.padEnd_string"),
      },
    ],
  },
];

export const FAKER_SPLIT_CONST = ".";

export const FAKERJS_BOOLEAN_OPTIONS = ["false", "true"];

export const DATE_FORMAT_OPTIONS = [
  {
    value: "YYYY/MM/DD",
    label: "",
  },
  {
    value: "DD/MM/YYYY",
    label: "",
  },
  {
    value: "DD-MMM-YYYY",
    label: "",
  },
  {
    value: "YYYY/MM/DD HH:mm:ss",
    label: "",
  },
  {
    value: "YYYY-MM-DDTHH:mm:ss",
    label: "",
  },
  {
    value: "YYYY-MM-DDTHH:mm:ssZ",
    label: "",
  },
  {
    value: "YY",
    get label() {
      return i18next.t("var_insert.date_desc.d1");
    },
  },
  {
    value: "YYYY",
    get label() {
      return i18next.t("var_insert.date_desc.d2");
    },
  },
  {
    value: "M",
    get label() {
      return i18next.t("var_insert.date_desc.d3");
    },
  },
  {
    value: "MM",
    get label() {
      return i18next.t("var_insert.date_desc.d4");
    },
  },
  {
    value: "MMM",
    get label() {
      return i18next.t("var_insert.date_desc.d5");
    },
  },
  {
    value: "MMMM",
    get label() {
      return i18next.t("var_insert.date_desc.d6");
    },
  },
  {
    value: "D",
    get label() {
      return i18next.t("var_insert.date_desc.d7");
    },
  },
  {
    value: "DD",
    get label() {
      return i18next.t("var_insert.date_desc.d8");
    },
  },
  {
    value: "d",
    get label() {
      return i18next.t("var_insert.date_desc.d9");
    },
  },
  {
    value: "dd",
    get label() {
      return i18next.t("var_insert.date_desc.d10");
    },
  },
  {
    value: "ddd",
    get label() {
      return i18next.t("var_insert.date_desc.d11");
    },
  },
  {
    value: "dddd",
    get label() {
      return i18next.t("var_insert.date_desc.d12");
    },
  },
  {
    value: "H",
    get label() {
      return i18next.t("var_insert.date_desc.d13");
    },
  },
  {
    value: "HH",
    get label() {
      return i18next.t("var_insert.date_desc.d14");
    },
  },
  {
    value: "h",
    get label() {
      return i18next.t("var_insert.date_desc.d15");
    },
  },
  {
    value: "hh",
    get label() {
      return i18next.t("var_insert.date_desc.d16");
    },
  },
  {
    value: "m",
    get label() {
      return i18next.t("var_insert.date_desc.d17");
    },
  },
  {
    value: "mm",
    get label() {
      return i18next.t("var_insert.date_desc.d18");
    },
  },
  {
    value: "s",
    get label() {
      return i18next.t("var_insert.date_desc.d19");
    },
  },
  {
    value: "ss",
    get label() {
      return i18next.t("var_insert.date_desc.d20");
    },
  },
  {
    value: "SSS",
    get label() {
      return i18next.t("var_insert.date_desc.d21");
    },
  },
  {
    value: "Z",
    get label() {
      return i18next.t("var_insert.date_desc.d22");
    },
  },
  {
    value: "ZZ",
    get label() {
      return i18next.t("var_insert.date_desc.d23");
    },
  },
  {
    value: "A",
    get label() {
      return i18next.t("var_insert.date_desc.d24");
    },
  },
  {
    value: "a",
    get label() {
      return i18next.t("var_insert.date_desc.d25");
    },
  },
  {
    value: "Q",
    get label() {
      return i18next.t("var_insert.date_desc.d26");
    },
  },
  {
    value: "Do",
    get label() {
      return i18next.t("var_insert.date_desc.d27");
    },
  },
  {
    value: "k",
    get label() {
      return i18next.t("var_insert.date_desc.d28");
    },
  },
  {
    value: "kk",
    get label() {
      return i18next.t("var_insert.date_desc.d29");
    },
  },
  {
    value: "X",
    get label() {
      return i18next.t("var_insert.date_desc.d30");
    },
  },
  {
    value: "x",
    get label() {
      return i18next.t("var_insert.date_desc.d31");
    },
  },
];

export const FAKERJS_FORMAT_LIST = [
  "date.anytime",
  "date.between",
  "date.betweens",
  "date.birthdate",
  "date.future",
  "date.past",
  "date.recent",
  "date.soon",
  "git.commitdate",
];

export const TIME_ZONE_OPTIONS = [
  {
    get label() {
      return i18next.t("var_insert.utc_desc.ut-12");
    },
    value: "-12:00",
  },
  {
    get label() {
      return i18next.t("var_insert.utc_desc.ut-11");
    },
    value: "-11:00",
  },
  {
    get label() {
      return i18next.t("var_insert.utc_desc.ut-10");
    },
    value: "-10:00",
  },
  {
    get label() {
      return i18next.t("var_insert.utc_desc.ut-9");
    },
    value: "-09:00",
  },
  {
    get label() {
      return i18next.t("var_insert.utc_desc.ut-8");
    },
    value: "-08:00",
  },
  {
    get label() {
      return i18next.t("var_insert.utc_desc.ut-7");
    },
    value: "-07:00",
  },
  {
    get label() {
      return i18next.t("var_insert.utc_desc.ut-6");
    },
    value: "-06:00",
  },
  {
    get label() {
      return i18next.t("var_insert.utc_desc.ut-5");
    },
    value: "-05:00",
  },
  {
    get label() {
      return i18next.t("var_insert.utc_desc.ut-4");
    },
    value: "-04:00",
  },
  {
    get label() {
      return i18next.t("var_insert.utc_desc.ut-3");
    },
    value: "-03:00",
  },
  {
    get label() {
      return i18next.t("var_insert.utc_desc.ut-2");
    },
    value: "-02:00",
  },
  {
    get label() {
      return i18next.t("var_insert.utc_desc.ut-1");
    },
    value: "-01:00",
  },
  {
    label: "UTC",
    value: "+00:00",
  },
  {
    get label() {
      return i18next.t("var_insert.utc_desc.ut+1");
    },
    value: "+01:00",
  },
  {
    get label() {
      return i18next.t("var_insert.utc_desc.ut+2");
    },
    value: "+02:00",
  },
  {
    get label() {
      return i18next.t("var_insert.utc_desc.ut+3");
    },
    value: "+03:00",
  },
  {
    get label() {
      return i18next.t("var_insert.utc_desc.ut+4");
    },
    value: "+04:00",
  },
  {
    get label() {
      return i18next.t("var_insert.utc_desc.ut+5");
    },
    value: "+05:00",
  },
  {
    get label() {
      return i18next.t("var_insert.utc_desc.ut+6");
    },
    value: "+06:00",
  },
  {
    get label() {
      return i18next.t("var_insert.utc_desc.ut+7");
    },
    value: "+07:00",
  },
  {
    get label() {
      return i18next.t("var_insert.utc_desc.ut+8");
    },
    value: "+08:00",
  },
  {
    get label() {
      return i18next.t("var_insert.utc_desc.ut+9");
    },
    value: "+09:00",
  },
  {
    get label() {
      return i18next.t("var_insert.utc_desc.ut+10");
    },
    value: "+10:00",
  },
  {
    get label() {
      return i18next.t("var_insert.utc_desc.ut+11");
    },
    value: "+11:00",
  },
  {
    get label() {
      return i18next.t("var_insert.utc_desc.ut+12");
    },
    value: "+12:00",
  },
];
