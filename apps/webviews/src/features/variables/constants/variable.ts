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

export enum PARSE_KEY {
  fixed = "fixed",
  fakerjs = "fakerjs",
  variable = "variable",
  ai = "ai",
}

export const VARIABLE_TABS_LIST = [
  {
    value: VARIABLE_TABS_VALUE.value,
    label: t("common.request_table.param_value"),
  },
  {
    value: VARIABLE_TABS_VALUE.desc,
    label: t("supplement.desc"),
  },
];

export const VARIABLE_TABS_EDIT_LIST = [
  {
    value: VARIABLE_TABS_VALUE.value,
    label: t("common.request_table.param_value"),
  },
];

export const ASSIGNMENT_VALUE_OPTIONS = [
  {
    value: ASSIGNMENT_VALUE_KEY.fixed,
    label: t("var_insert.generate_value"),
  },
  {
    value: ASSIGNMENT_VALUE_KEY.random,
    label: t("var_insert.send_random"),
  },
];

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

export const OPTIONS_KEY_MAP = {
  [VAR_OPTIONS_KEY.var]: t("var_insert.quote_var"),
  [VAR_OPTIONS_KEY.mock]: t("var_insert.mock_data"),
  [VAR_OPTIONS_KEY.fixed]: t("var_insert.fixed_value"),
  [VAR_OPTIONS_KEY.ai_value]: t("var_insert.ai_value"),
  [VAR_OPTIONS_KEY.desc]: t("settings.description.title"),
  [VAR_OPTIONS_KEY.ai_desc]: t("var_insert.ai_des"),
};

export const OPTIONS_KEY_LABEL_MAP = {
  [VAR_OPTIONS_KEY.var]: t("supplement.var_name"),
  [VAR_OPTIONS_KEY.mock]: t("settings.mock_rules.mock_rule"),
  [VAR_OPTIONS_KEY.fixed]: t("var_insert.fixed_value"),
  [VAR_OPTIONS_KEY.ai_value]: t("var_insert.api_fixed_type"),
  [VAR_OPTIONS_KEY.desc]: "",
  [VAR_OPTIONS_KEY.ai_desc]: "",
};

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

export const FAKERJS_COLOR_FORMAT_OPTIONS = ["css", "binary", "decimal"];

export const FAKERJS_CASING_OPTIONS = ["lower", "upper", "mixed"];

export const FAKERJS_EMOJI_OPTIONS = [
  "smiley",
  "body",
  "person",
  "nature",
  "food",
  "travel",
  "activity",
  "object",
  "symbol",
  "flag",
];

export const FAKERJS_HTTP_OPTIONS = [
  "informational",
  "success",
  "clientError",
  "serverError",
  "redirection",
];

export const FAKERJS_PROTOCOL_OPTIONS = ["http", "https"];

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
    label: i18next.t("var_insert.date_desc.d1"),
  },
  {
    value: "YYYY",
    label: i18next.t("var_insert.date_desc.d2"),
  },
  {
    value: "M",
    label: i18next.t("var_insert.date_desc.d3"),
  },
  {
    value: "MM",
    label: i18next.t("var_insert.date_desc.d4"),
  },
  {
    value: "MMM",
    label: i18next.t("var_insert.date_desc.d5"),
  },
  {
    value: "MMMM",
    label: i18next.t("var_insert.date_desc.d6"),
  },
  {
    value: "D",
    label: i18next.t("var_insert.date_desc.d7"),
  },
  {
    value: "DD",
    label: i18next.t("var_insert.date_desc.d8"),
  },
  {
    value: "d",
    label: i18next.t("var_insert.date_desc.d9"),
  },
  {
    value: "dd",
    label: i18next.t("var_insert.date_desc.d10"),
  },
  {
    value: "ddd",
    label: i18next.t("var_insert.date_desc.d11"),
  },
  {
    value: "dddd",
    label: i18next.t("var_insert.date_desc.d12"),
  },
  {
    value: "H",
    label: i18next.t("var_insert.date_desc.d13"),
  },
  {
    value: "HH",
    label: i18next.t("var_insert.date_desc.d14"),
  },
  {
    value: "h",
    label: i18next.t("var_insert.date_desc.d15"),
  },
  {
    value: "hh",
    label: i18next.t("var_insert.date_desc.d16"),
  },
  {
    value: "m",
    label: i18next.t("var_insert.date_desc.d17"),
  },
  {
    value: "mm",
    label: i18next.t("var_insert.date_desc.d18"),
  },
  {
    value: "s",
    label: i18next.t("var_insert.date_desc.d19"),
  },
  {
    value: "ss",
    label: i18next.t("var_insert.date_desc.d20"),
  },
  {
    value: "SSS",
    label: i18next.t("var_insert.date_desc.d21"),
  },
  {
    value: "Z",
    label: i18next.t("var_insert.date_desc.d22"),
  },
  {
    value: "ZZ",
    label: i18next.t("var_insert.date_desc.d23"),
  },
  {
    value: "A",
    label: i18next.t("var_insert.date_desc.d24"),
  },
  {
    value: "a",
    label: i18next.t("var_insert.date_desc.d25"),
  },
  {
    value: "Q",
    label: i18next.t("var_insert.date_desc.d26"),
  },
  {
    value: "Do",
    label: i18next.t("var_insert.date_desc.d27"),
  },
  {
    value: "k",
    label: i18next.t("var_insert.date_desc.d28"),
  },
  {
    value: "kk",
    label: i18next.t("var_insert.date_desc.d29"),
  },
  {
    value: "X",
    label: i18next.t("var_insert.date_desc.d30"),
  },
  {
    value: "x",
    label: i18next.t("var_insert.date_desc.d31"),
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
    label: i18next.t("var_insert.utc_desc.ut-12"),
    value: "-12:00",
  },
  {
    label: i18next.t("var_insert.utc_desc.ut-11"),
    value: "-11:00",
  },
  {
    label: i18next.t("var_insert.utc_desc.ut-10"),
    value: "-10:00",
  },
  {
    label: i18next.t("var_insert.utc_desc.ut-9"),
    value: "-09:00",
  },
  {
    label: i18next.t("var_insert.utc_desc.ut-8"),
    value: "-08:00",
  },
  {
    label: i18next.t("var_insert.utc_desc.ut-7"),
    value: "-07:00",
  },
  {
    label: i18next.t("var_insert.utc_desc.ut-6"),
    value: "-06:00",
  },
  {
    label: i18next.t("var_insert.utc_desc.ut-5"),
    value: "-05:00",
  },
  {
    label: i18next.t("var_insert.utc_desc.ut-4"),
    value: "-04:00",
  },
  {
    label: i18next.t("var_insert.utc_desc.ut-3"),
    value: "-03:00",
  },
  {
    label: i18next.t("var_insert.utc_desc.ut-2"),
    value: "-02:00",
  },
  {
    label: i18next.t("var_insert.utc_desc.ut-1"),
    value: "-01:00",
  },
  {
    label: "UTC",
    value: "+00:00",
  },
  {
    label: i18next.t("var_insert.utc_desc.ut+1"),
    value: "+01:00",
  },
  {
    label: i18next.t("var_insert.utc_desc.ut+2"),
    value: "+02:00",
  },
  {
    label: i18next.t("var_insert.utc_desc.ut+3"),
    value: "+03:00",
  },
  {
    label: i18next.t("var_insert.utc_desc.ut+4"),
    value: "+04:00",
  },
  {
    label: i18next.t("var_insert.utc_desc.ut+5"),
    value: "+05:00",
  },
  {
    label: i18next.t("var_insert.utc_desc.ut+6"),
    value: "+06:00",
  },
  {
    label: i18next.t("var_insert.utc_desc.ut+7"),
    value: "+07:00",
  },
  {
    label: i18next.t("var_insert.utc_desc.ut+8"),
    value: "+08:00",
  },
  {
    label: i18next.t("var_insert.utc_desc.ut+9"),
    value: "+09:00",
  },
  {
    label: i18next.t("var_insert.utc_desc.ut+10"),
    value: "+10:00",
  },
  {
    label: i18next.t("var_insert.utc_desc.ut+11"),
    value: "+11:00",
  },
  {
    label: i18next.t("var_insert.utc_desc.ut+12"),
    value: "+12:00",
  },
];
