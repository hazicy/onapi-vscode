/* eslint-disable quotes */
import i18next from "i18next";

import { InnerFuncListItem } from "@onapi/http-model/requests/types/variable";

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

export const FAKER_SPLIT_CONST = "@/features/variables/constants";

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

export const FAKERJS_VAR_LIST = [
  {
    module: "Airline",
    function: "aircraftType",
    description: {
      "zh-CN": "返回一种随机的飞机类型。",
      "zh-TW": "返回一種隨機的飛機類型。",
      en: "Returns a random aircraft type.",
      ja: "ランダムな航空機の種類を返します。",
      id: "Mengembalikan jenis pesawat secara acak.",
    },
    params: {},
  },
  {
    module: "Airline",
    function: "airlineName",
    suffix: "name",
    description: {
      "zh-CN": "生成一家随机的航空公司名称。",
      "zh-TW": "生成一家隨機的航空公司名稱。",
      en: "Generate a random airline name.",
      ja: "ランダムな航空会社名を生成する。",
      id: "Generate nama maskapai penerbangan secara acak.",
    },
    params: {},
  },
  {
    module: "Airline",
    function: "airlineIataCode",
    suffix: "iataCode",
    description: {
      "zh-CN": "生成一个随机的IATA航空公司代码。",
      "zh-TW": "生成一個隨機的IATA航空公司代碼。",
      en: "Generate a random IATA airline code.",
      ja: "ランダムな航空機の種類を生成します。",
      id: "Menghasilkan kode IATA dari maskapai penerbangan secara acak.",
    },
    params: {},
  },
  {
    module: "Airline",
    function: "airplaneName",
    suffix: "name",
    description: {
      "zh-CN": "生成一架随机的飞机名称。",
      "zh-TW": "生成一架隨機的飛機名稱。",
      en: "Generate a random aircraft name.",
      ja: "ランダムな航空機名を生成する。",
      id: "Generate nama pesawat secara acak.",
    },
    params: {},
  },
  {
    module: "Airline",
    function: "airplaneIataTypeCode",
    suffix: "iataTypeCode",
    description: {
      "zh-CN": "生成一架随机的IATA飞机类型代码。",
      "zh-TW": "生成一架隨機的IATA飛機類型代碼。",
      en: "Generate a random IATA aircraft type code.",
      ja: "ランダムなIATA航空機タイプコードを生成する。",
      id: "Generate kode jenis pesawat IATA secara acak.",
    },
    params: {},
  },
  {
    module: "Airline",
    function: "airportName",
    suffix: "name",
    description: {
      "zh-CN": "生成一个随机的机场名称。",
      "zh-TW": "生成一個隨機的機場名稱。",
      en: "Generate a random airport name.",
      ja: "ランダムな空港名を生成する。",
      id: "Generate nama bandara secara acak.",
    },
    params: {},
  },
  {
    module: "Airline",
    function: "airportIataCode",
    suffix: "iataCode",
    description: {
      "zh-CN": "生成一个随机的IATA机场代码。",
      "zh-TW": "生成一個隨機的IATA機場代碼。",
      en: "Generate a random IATA airport code.",
      ja: "ランダムなIATA空港コードを生成する。",
      id: "Generate kode bandara IATA secara acak.",
    },
    params: {},
  },
  {
    module: "Airline",
    function: "flightNumber",
    description: {
      "zh-CN": "返回一个随机的航班号。航班号通常由 1 到 4 位数字构成。",
      "zh-TW": "返回一個隨機的航班號。航班號通常由 1 到 4 位數字組成。",
      en: "Returns a random flight number. Flight numbers are always 1 to 4 digits long.",
      ja: "ランダムなフライト番号を返します。フライト番号は常に1から4桁の長さです。",
      id: "Mengembalikan nomor penerbangan acak. Nomor penerbangan selalu terdiri dari 1 hingga 4 digit.",
    },
    params: {
      addLeadingZeros: {
        isrealKey: true,
        type: "boolean",
        default: false,
        description: {
          "zh-CN": "是否将航班号前补零至 4 位数字。",
          "zh-TW": "是否將航班號前補零至 4 位數字。",
          en: "Should the flight number be padded with zeros to make it 4 digits long?",
          ja: "フライト番号を4桁にするためにゼロを先頭に追加する必要がありますか？",
          id: "Apakah nomor penerbangan harus dilengkapi dengan nol di depan agar menjadi 4 digit?",
        },
      },
      length: {
        isrealKey: true,
        type: "number",
        default: "{ min: 1, max: 4 }",
        description: {
          "zh-CN": "生成的数字长度或范围。",
          "zh-TW": "生成的數字長度或範圍。",
          en: "Length or range of the generated number.",
          ja: "生成される数字の長さまたは範囲。",
          id: "Panjang atau rentang nomor yang dihasilkan.",
        },
      },
      "length.min": {
        isrealKey: true,
        type: "number",
        default: 1,
        description: {
          "zh-CN": "生成数字长度或范围的最小值。",
          "zh-TW": "生成數字長度或範圍的最小值。",
          en: "Minimum value of the length or range of the generated number.",
          ja: "生成される数字の長さまたは範囲の最小値。",
          id: "Nilai minimum dari panjang atau rentang nomor yang dihasilkan.",
        },
      },
      "length.max": {
        isrealKey: true,
        type: "number",
        default: 4,
        description: {
          "zh-CN": "生成数字长度或范围的最大值。",
          "zh-TW": "生成數字長度或範圍的最大值。",
          en: "Maximum value of the length or range of the generated number.",
          ja: "生成される数字の長さまたは範囲の最大値。",
          id: "Nilai maksimum dari panjang atau rentang nomor yang dihasilkan.",
        },
      },
    },
  },
  {
    module: "Airline",
    function: "recordLocator",
    description: {
      "zh-CN": "生成一个随机的记录定位符。",
      "zh-TW": "生成一個隨機的紀錄定位符。",
      en: "Generates a random record locator.",
      ja: "ランダムな記録ロケーターを生成します。",
      id: "Menghasilkan locator rekaman acak.",
    },
    params: {
      allowNumerics: {
        isrealKey: true,
        type: "boolean",
        default: false,
        description: {
          "zh-CN": "是否允许数字字符。",
          "zh-TW": "是否允許數字字符。",
          en: "Are numeric characters allowed?",
          ja: "数字文字は許可されていますか？",
          id: "Apakah karakter numerik diizinkan?",
        },
      },
      allowVisuallySimilarCharacters: {
        isrealKey: true,
        type: "boolean",
        default: false,
        description: {
          "zh-CN": "是否允许视觉上相似的字符，例如 '1' 和 'I'。",
          "zh-TW": "是否允許視覺上相似的字符，例如 '1' 和 'I'。",
          en: "Whether visually similar characters such as '1' and 'I' are allowed.",
          ja: "視覚的に似た文字（例えば '1' と 'I'）を許可するかどうか。",
          id: "Apakah karakter-karakter yang mirip secara visual seperti '1' dan 'I' diizinkan.",
        },
      },
    },
  },
  {
    module: "Airline",
    function: "seat",
    description: {
      "zh-CN": "生成一个随机座位。",
      "zh-TW": "生成一個隨機座位。",
      en: "Generates a random seat.",
      ja: "ランダムな座席を生成します。",
      id: "Menghasilkan kursi acak.",
    },
    params: {
      aircraftType: {
        isrealKey: true,
        type: "enum(narrowbody|regional|widebody)",
        default: "narrowbody",
        description: {
          "zh-CN": "飞机类型。可以是狭体、区域性、宽体中的一种。",
          "zh-TW": "飛機類型。可以是狹體、區域性、寬體中的一種。",
          en: "Aircraft type. It can be one of narrow-body, regional, or wide-body.",
          ja: "航空機のタイプ。狭体、地域向け、広体のいずれかです。",
          id: "Jenis pesawat. Bisa salah satu dari pesawat sempit, regional, atau lebar.",
        },
      },
    },
  },
  {
    module: "Animal",
    function: "bear",
    description: {
      "zh-CN": "返回一种随机的熊种类。",
      "zh-TW": "返回一種隨機的熊種類。",
      en: "Returns a random bear species.",
      ja: "ランダムなクマの種を返します。",
      id: "Mengembalikan spesies beruang acak.",
    },
    params: {},
  },
  {
    module: "Animal",
    function: "bird",
    description: {
      "zh-CN": "返回一种随机的鸟类。",
      "zh-TW": "返回一種隨機的鳥類。",
      en: "Returns a random bird species.",
      ja: "ランダムな鳥の種を返します。",
      id: "Mengembalikan spesies burung acak.",
    },
    params: {},
  },
  {
    module: "Animal",
    function: "cat",
    description: {
      "zh-CN": "返回一种随机的猫品种。",
      "zh-TW": "返回一種隨機的貓品種。",
      en: "Returns a random cat breed.",
      ja: "ランダムな猫の品種を返します。",
      id: "Mengembalikan ras kucing acak.",
    },
    params: {},
  },
  {
    module: "Animal",
    function: "cetacean",
    description: {
      "zh-CN": "返回一种随机的鲸目物种。",
      "zh-TW": "返回一種隨機的鯨目物種。",
      en: "Returns a random cetacean species.",
      ja: "ランダムなクジラ目の種を返します。",
      id: "Mengembalikan spesies cetacea acak.",
    },
    params: {},
  },
  {
    module: "Animal",
    function: "cow",
    description: {
      "zh-CN": "返回一种随机的牛种类。",
      "zh-TW": "返回一種隨機的牛種類。",
      en: "Returns a random cow species.",
      ja: "ランダムな牛の種を返します。",
      id: "Mengembalikan spesies sapi acak.",
    },
    params: {},
  },
  {
    module: "Animal",
    function: "crocodilia",
    description: {
      "zh-CN": "返回一种随机的鳄类物种。",
      "zh-TW": "返回一種隨機的鱷類物種。",
      en: "Returns a random crocodilian species.",
      ja: "ランダムなワニ目の種を返します。",
      id: "Mengembalikan spesies krokodil acak.",
    },
    params: {},
  },
  {
    module: "Animal",
    function: "dog",
    description: {
      "zh-CN": "返回一种随机的狗品种。",
      "zh-TW": "返回一種隨機的狗品種。",
      en: "Returns a random dog breed.",
      ja: "ランダムな犬の品種を返します。",
      id: "Mengembalikan ras anjing acak.",
    },
    params: {},
  },
  {
    module: "Animal",
    function: "fish",
    description: {
      "zh-CN": "返回一种随机的鱼类。",
      "zh-TW": "返回一種隨機的魚類。",
      en: "Returns a random fish species.",
      ja: "ランダムな魚の種を返します。",
      id: "Mengembalikan spesies ikan acak.",
    },
    params: {},
  },
  {
    module: "Animal",
    function: "horse",
    description: {
      "zh-CN": "返回一种随机的马品种。",
      "zh-TW": "返回一種隨機的馬品種。",
      en: "Returns a random horse breed.",
      ja: "ランダムな馬の品種を返します。",
      id: "Mengembalikan ras kuda acak.",
    },
    params: {},
  },
  {
    module: "Animal",
    function: "insect",
    description: {
      "zh-CN": "返回一种随机的昆虫种类。",
      "zh-TW": "返回一種隨機的昆蟲種類。",
      en: "Returns a random insect species.",
      ja: "ランダムな昆虫の種を返します。",
      id: "Mengembalikan spesies serangga acak.",
    },
    params: {},
  },
  {
    module: "Animal",
    function: "lion",
    description: {
      "zh-CN": "返回一种随机的狮子种类。",
      "zh-TW": "返回一種隨機的獅子種類。",
      en: "Returns a random lion species.",
      ja: "ランダムなライオンの種を返します。",
      id: "Mengembalikan spesies singa acak.",
    },
    params: {},
  },
  {
    module: "Animal",
    function: "petName",
    description: {
      "zh-CN": "返回一个随机的宠物名字。",
      "zh-TW": "返回一個隨機的寵物名字。",
      en: "Returns a random pet name.",
      ja: "ランダムなペットの名前を返します。",
      id: "Mengembalikan nama hewan peliharaan acak.",
    },
    params: {},
  },
  {
    module: "Animal",
    function: "rabbit",
    description: {
      "zh-CN": "返回一种随机的兔子种类。",
      "zh-TW": "返回一種隨機的兔子種類。",
      en: "Returns a random rabbit species.",
      ja: "ランダムなウサギの種を返します。",
      id: "Mengembalikan spesies kelinci acak.",
    },
    params: {},
  },
  {
    module: "Animal",
    function: "rodent",
    description: {
      "zh-CN": "返回一种随机的啮齿动物品种。",
      "zh-TW": "返回一種隨機的齧齒類品種。",
      en: "Returns a random rodent breed.",
      ja: "ランダムな齧歯動物の品種を返します。",
      id: "Mengembalikan ras rodent acak.",
    },
    params: {},
  },
  {
    module: "Animal",
    function: "snake",
    description: {
      "zh-CN": "返回一种随机的蛇种类。",
      "zh-TW": "返回一種隨機的蛇種類。",
      en: "Returns a random snake species.",
      ja: "ランダムなヘビの種を返します。",
      id: "Mengembalikan spesies ular acak.",
    },
    params: {},
  },
  {
    module: "Animal",
    function: "type",
    description: {
      "zh-CN": "返回一种随机的动物类型。",
      "zh-TW": "返回一種隨機的動物類型。",
      en: "Returns a random animal type.",
      ja: "ランダムな動物の種類を返します。",
      id: "Mengembalikan jenis hewan acak.",
    },
    params: {},
  },
  {
    module: "Book",
    function: "author",
    description: {
      "zh-CN": "返回一个随机的作者名字。",
      "zh-TW": "返回一個隨機的作者名字。",
      en: "Returns a random author name.",
      ja: "ランダムな著者名を返します。",
      id: "Mengembalikan nama penulis acak.",
    },
    params: {},
  },
  {
    module: "Book",
    function: "format",
    description: {
      "zh-CN": "返回一种随机的书籍格式。",
      "zh-TW": "返回一種隨機的書籍格式。",
      en: "Returns a random book format.",
      ja: "ランダムな書籍フォーマットを返します。",
      id: "Mengembalikan format buku acak.",
    },
    params: {},
  },
  {
    module: "Book",
    function: "genre",
    description: {
      "zh-CN": "返回一种随机的类型。",
      "zh-TW": "返回一種隨機的類型。",
      en: "Returns a random genre.",
      ja: "ランダムなジャンルを返します。",
      id: "Mengembalikan genre acak.",
    },
    params: {},
  },
  {
    module: "Book",
    function: "publisher",
    description: {
      "zh-CN": "返回一个随机的出版社。",
      "zh-TW": "返回一個隨機的出版社。",
      en: "Returns a random publisher.",
      ja: "ランダムな出版社を返します。",
      id: "Mengembalikan penerbit acak.",
    },
    params: {},
  },
  {
    module: "Book",
    function: "series",
    description: {
      "zh-CN": "返回一个随机的系列。",
      "zh-TW": "返回一個隨機的系列。",
      en: "Returns a random series.",
      ja: "ランダムなシリーズを返します。",
      id: "Mengembalikan seri acak.",
    },
    params: {},
  },
  {
    module: "Book",
    function: "title",
    description: {
      "zh-CN": "返回一个随机的书名。",
      "zh-TW": "返回一個隨機的書名。",
      en: "Returns a random title.",
      ja: "ランダムなタイトルを返します。",
      id: "Mengembalikan judul acak.",
    },
    params: {},
  },
  {
    module: "Color",
    function: "cmyk",
    description: {
      "zh-CN": "返回一个CMYK颜色。",
      "zh-TW": "返回一個CMYK顏色。",
      en: "Returns a CMYK color.",
      ja: "CMYKカラーを返します。",
      id: "Mengembalikan warna CMYK.",
    },
    params: {
      format: {
        isrealKey: true,
        type: "enum(css|binary|decimal)",
        default: "decimal",
        description: {
          "zh-CN": "生成的CMYK颜色的格式。",
          "zh-TW": "生成的CMYK顏色的格式。",
          en: "The format of the generated CMYK colors.",
          ja: "生成されたCMYK色のフォーマット。",
          id: "Format warna CMYK yang dihasilkan.",
        },
      },
    },
  },
  {
    module: "Color",
    function: "colorByCSSColorSpace",
    description: {
      "zh-CN": "根据指定的CSS颜色空间返回颜色。",
      "zh-TW": "根據指定的CSS顏色空間返回顏色。",
      en: "Returns a random color based on CSS color space specified.",
      ja: "指定されたCSSカラースペースに基づいてランダムな色を返します。",
      id: "Mengembalikan warna acak berdasarkan ruang warna CSS yang ditentukan.",
    },
    params: {
      format: {
        isrealKey: true,
        type: "enum(css|binary|decimal)",
        default: "decimal",
        description: {
          "zh-CN": "生成的RGB颜色的格式。",
          "zh-TW": "生成的RGB顏色的格式。",
          en: "The format of the generated RGB colors.",
          ja: "生成されたRGB色のフォーマット。",
          id: "Format warna RGB yang dihasilkan.",
        },
      },
      space: {
        isrealKey: true,
        type: "enum(sRGB | display-p3 | rec2020 | a98-rgb | prophoto-rgb)",
        default: "sRGB",
        description: {
          "zh-CN": "生成颜色的颜色空间。",
          "zh-TW": "生成顏色的顏色空間。",
          en: "The color space of the generated color.",
          ja: "生成された色の色空間。",
          id: "Ruang warna dari warna yang dihasilkan.",
        },
      },
    },
  },
  {
    module: "Color",
    function: "cssSupportedFunction",
    description: {
      "zh-CN": "返回一个随机的CSS支持的颜色函数名。",
      "zh-TW": "返回一個隨機的CSS支持的顏色函數名。",
      en: "Returns a random css supported color function name.",
      ja: "ランダムなCSSサポートのカラー関数名を返します。",
      id: "Mengembalikan nama fungsi warna CSS yang didukung acak.",
    },
    params: {},
  },
  {
    module: "Color",
    function: "cssSupportedSpace",
    description: {
      "zh-CN": "返回一个随机的CSS支持的颜色空间名。",
      "zh-TW": "返回一個隨機的CSS支持的顏色空間名。",
      en: "Returns a random css supported color space name.",
      ja: "ランダムなCSSサポートのカラースペース名を返します。",
      id: "Mengembalikan nama ruang warna CSS yang didukung secara acak.",
    },
    params: {},
  },
  {
    module: "Color",
    function: "hsl",
    description: {
      "zh-CN": "返回一个HSL颜色。",
      "zh-TW": "返回一個HSL顏色。",
      en: "Returns an HSL color.",
      ja: "HSLカラーを返します。",
      id: "Mengembalikan warna HSL.",
    },
    params: {
      format: {
        isrealKey: true,
        type: "enum(css|binary|decimal)",
        default: "decimal",
        description: {
          "zh-CN": "生成的HSL颜色的格式。",
          "zh-TW": "生成的HSL顏色的格式。",
          en: "The format of the generated HSL colors.",
          ja: "生成されたHSL色のフォーマット。",
          id: "Format warna HSL yang dihasilkan.",
        },
      },
      includeAlpha: {
        isrealKey: true,
        type: "boolean",
        default: false,
        description: {
          "zh-CN": "为颜色添加一个alpha值（RGBA）。",
          "zh-TW": "為顏色添加一個alpha值（RGBA）。",
          en: "Add an alpha value (RGBA) to the color.",
          ja: "色にアルファ値（RGBA）を追加します。",
          id: "Tambahkan nilai alpha (RGBA) ke warna.",
        },
      },
    },
  },
  {
    module: "Color",
    function: "human",
    description: {
      "zh-CN": "返回一个随机的人类可读颜色名。",
      "zh-TW": "返回一個隨機的人類可讀的顏色名。",
      en: "Returns a random human-readable color name.",
      ja: "ランダムな人間が読める色名を返します。",
      id: "Mengembalikan nama warna yang dapat dibaca oleh manusia.",
    },
    params: {},
  },
  {
    module: "Color",
    function: "hwb",
    description: {
      "zh-CN": "返回一个HWB颜色。",
      "zh-TW": "返回一個HWB顏色。",
      en: "Returns an HWB color.",
      ja: "HWBカラーを返します。",
      id: "Mengembalikan warna HWB.",
    },
    params: {
      format: {
        isrealKey: true,
        type: "enum(css|binary|decimal)",
        default: "decimal",
        description: {
          "zh-CN": "生成的RGB颜色的格式。",
          "zh-TW": "生成的RGB顏色的格式。",
          en: "The format of the generated RGB colors.",
          ja: "生成されたRGB色のフォーマット。",
          id: "Format warna RGB yang dihasilkan.",
        },
      },
    },
  },
  {
    module: "Color",
    function: "lab",
    description: {
      "zh-CN": "返回一个LAB（CIELAB）颜色。",
      "zh-TW": "返回一個LAB（CIELAB）顏色。",
      en: "Returns a LAB (CIELAB) color.",
      ja: "LAB（CIELAB）カラーを返します。",
      id: "Mengembalikan warna LAB (CIELAB).",
    },
    params: {
      format: {
        isrealKey: true,
        type: "enum(css|binary|decimal)",
        default: "decimal",
        description: {
          "zh-CN": "生成的RGB颜色的格式。",
          "zh-TW": "生成的RGB顏色的格式。",
          en: "The format of the generated RGB colors.",
          ja: "生成されたRGB色のフォーマット。",
          id: "Format warna RGB yang dihasilkan.",
        },
      },
    },
  },
  {
    module: "Color",
    function: "lch",
    description: {
      "zh-CN": "返回一个LCH颜色。",
      "zh-TW": "返回一個LCH顏色。",
      en: "Returns an LCH color.",
      ja: "LCHカラーを返します。",
      id: "Mengembalikan warna LCH.",
    },
    params: {
      format: {
        isrealKey: true,
        type: "enum(css|binary|decimal)",
        default: "decimal",
        description: {
          "zh-CN": "生成的RGB颜色的格式。",
          "zh-TW": "生成的RGB顏色的格式。",
          en: "The format of the generated RGB colors.",
          ja: "生成されたRGB色のフォーマット。",
          id: "Format warna RGB yang dihasilkan.",
        },
      },
    },
  },
  {
    module: "Color",
    function: "rgb",
    description: {
      "zh-CN": "返回一个RGB颜色。",
      "zh-TW": "返回一個RGB顏色。",
      en: "Returns an RGB color.",
      ja: "RGBカラーを返します。",
      id: "Mengembalikan warna RGB.",
    },
    params: {
      casing: {
        isrealKey: true,
        type: "enum(lower|upper|mixed)",
        default: "lower",
        description: {
          "zh-CN": "生成的十六进制颜色的字母大小写。仅在使用'hex'格式时应用。",
          "zh-TW": "生成的十六進制顏色的字母大小寫。僅在使用'hex'格式時應用。",
          en: "The letter case of the generated hexadecimal colors. Applies only when using the 'hex' format.",
          ja: "生成された十六進数色の文字の大文字小文字。'hex'形式を使用する場合にのみ適用されます。",
          id: "Huruf besar dan kecil dari warna heksadesimal yang dihasilkan. Berlaku hanya saat menggunakan format 'hex'.",
        },
      },
      format: {
        isrealKey: true,
        type: "enum(css | binary| decimal | hex)",
        default: "hex",
        description: {
          "zh-CN": "生成的RGB颜色的格式。",
          "zh-TW": "生成的RGB顏色的格式。",
          en: "The format of the generated RGB colors.",
          ja: "生成されたRGB色のフォーマット。",
          id: "Format warna RGB yang dihasilkan.",
        },
      },
      includeAlpha: {
        isrealKey: true,
        type: "boolean",
        default: false,
        description: {
          "zh-CN": "为颜色添加一个alpha值（RGBA）。",
          "zh-TW": "為顏色添加一個alpha值（RGBA）。",
          en: "Add an alpha value (RGBA) to the color.",
          ja: "色にアルファ値（RGBA）を追加します。",
          id: "Tambahkan nilai alpha (RGBA) ke warna.",
        },
      },
      prefix: {
        isrealKey: true,
        type: "string",
        default: "#",
        description: {
          "zh-CN": "生成的十六进制颜色的前缀。仅在使用'hex'格式时应用。",
          "zh-TW": "生成的十六進制顏色的前綴。僅在使用'hex'格式時應用。",
          en: "The prefix of the generated hexadecimal colors. Applies only when using the 'hex' format.",
          ja: "生成された十六進数色の接頭辞。'hex'形式を使用する場合にのみ適用されます。",
          id: "Awalan warna heksadesimal yang dihasilkan. Berlaku hanya saat menggunakan format 'hex'.",
        },
      },
    },
  },
  {
    module: "Color",
    function: "space",
    description: {
      "zh-CN": "返回来自全球接受的颜色空间中的一个随机颜色空间名称。",
      "zh-TW": "返回來自全球接受的顏色空間中的一個隨機顏色空間名稱。",
      en: "Returns a random color space name from the worldwide accepted color spaces.",
      ja: "世界的に受け入れられているカラースペースからランダムなカラースペース名を返します。",
      id: "Mengembalikan nama ruang warna acak dari ruang warna yang diterima secara global.",
    },
    params: {},
  },
  {
    module: "Commerce",
    function: "department",
    description: {
      "zh-CN": "返回商店内部的一个部门。",
      "zh-TW": "返回商店內部的一個部門。",
      en: "Returns a department inside a shop.",
      ja: "店舗内の部門を返します。",
      id: "Mengembalikan departemen di dalam toko.",
    },
    params: {},
  },
  {
    module: "Commerce",
    function: "isbn",
    description: {
      "zh-CN": "返回一个随机的ISBN标识符。",
      "zh-TW": "返回一個隨機的ISBN識別碼。",
      en: "Returns a random ISBN identifier.",
      ja: "ランダムなISBN識別子を返します。",
      id: "Mengembalikan pengenal ISBN acak.",
    },
    params: {
      variant: {
        isrealKey: true,
        type: "enum(10|13)",
        default: 13,
        description: {
          "zh-CN":
            "要返回的标识符的变体。可以是10（10位格式）或13（13位格式）。",
          "zh-TW":
            "要返回的識別符的變體。可以是10（10位格式）或13（13位格式）。",
          en: "Variants of the identifier to be returned. It can be 10 (10-digit format) or 13 (13-digit format).",
          ja: "返される識別子のバリエーション。10（10桁形式）または13（13桁形式）のいずれかです。",
          id: "Varian dari pengenal yang akan dikembalikan. Bisa 10 (format 10 digit) atau 13 (format 13 digit).",
        },
      },
      separator: {
        isrealKey: true,
        type: "string",
        default: "-",
        description: {
          "zh-CN": "格式中使用的分隔符。",
          "zh-TW": "格式中使用的分隔符。",
          en: "The delimiter used in the format.",
          ja: "フォーマットで使用される区切り文字。",
          id: "Pemisah yang digunakan dalam format.",
        },
      },
    },
  },
  {
    module: "Commerce",
    function: "price",
    description: {
      "zh-CN": "生成一个介于最小值和最大值之间（包含）的价格。",
      "zh-TW": "生成一個介於最小值和最大值之間（包含）的價格。",
      en: "Generates a price between min and max (inclusive).",
      ja: "最小値と最大値の間（含む）の価格を生成します。",
      id: "Menghasilkan harga antara batas minimum dan maksimum (inklusif).",
    },
    params: {
      dec: {
        isrealKey: true,
        type: "number",
        default: 2,
        description: {
          "zh-CN": "小数位数。",
          "zh-TW": "小數位數。",
          en: "The number of decimal places.",
          ja: "小数点以下の桁数。",
          id: "Jumlah digit di belakang koma.",
        },
      },
      max: {
        isrealKey: true,
        type: "number",
        default: 1000,
        description: {
          "zh-CN": "最大价格。",
          "zh-TW": "最大價格。",
          en: "The maximum price.",
          ja: "最大価格。",
          id: "Harga maksimum.",
        },
      },
      min: {
        isrealKey: true,
        type: "number",
        default: 1,
        description: {
          "zh-CN": "最低价格。",
          "zh-TW": "最低價格。",
          en: "The lowest price.",
          ja: "最低価格。",
          id: "Harga terendah.",
        },
      },
      symbol: {
        isrealKey: true,
        type: "string",
        default: "",
        description: {
          "zh-CN": "要使用的货币值。",
          "zh-TW": "要使用的貨幣值。",
          en: "The currency value to be used.",
          ja: "使用する通貨の価値。",
          id: "Nilai mata uang yang akan digunakan.",
        },
      },
    },
  },
  {
    module: "Commerce",
    function: "product",
    description: {
      "zh-CN": "返回一个短的产品名称。",
      "zh-TW": "返回一個短的產品名稱。",
      en: "Returns a short product name.",
      ja: "短い製品名を返します。",
      id: "Mengembalikan nama produk pendek.",
    },
    params: {},
  },
  {
    module: "Commerce",
    function: "productAdjective",
    description: {
      "zh-CN": "返回一个描述产品的形容词。",
      "zh-TW": "返回一個描述產品的形容詞。",
      en: "Returns an adjective describing a product.",
      ja: "製品を説明する形容詞を返します。",
      id: "Mengembalikan kata sifat yang menggambarkan produk.",
    },
    params: {},
  },
  {
    module: "Commerce",
    function: "productDescription",
    description: {
      "zh-CN": "返回产品描述。",
      "zh-TW": "返回產品描述。",
      en: "Returns a product description.",
      ja: "製品の説明を返します。",
      id: "Mengembalikan deskripsi produk.",
    },
    params: {},
  },
  {
    module: "Commerce",
    function: "productMaterial",
    description: {
      "zh-CN": "返回产品的材料。",
      "zh-TW": "返回產品的材料。",
      en: "Returns a material of a product.",
      ja: "製品の素材を返します。",
      id: "Mengembalikan material produk.",
    },
    params: {},
  },
  {
    module: "Commerce",
    function: "productName",
    description: {
      "zh-CN": "生成一个随机的描述性产品名称。",
      "zh-TW": "生成一個隨機的描述性產品名稱。",
      en: "Generates a random descriptive product name.",
      ja: "ランダムな説明的製品名を生成します。",
      id: "Menghasilkan nama produk deskriptif acak.",
    },
    params: {},
  },
  {
    module: "Company",
    function: "buzzAdjective",
    description: {
      "zh-CN": "返回一个随机的流行形容词，可以用来展示经理正在查看的数据。",
      "zh-TW": "返回一個隨機的流行形容詞，可以用來展示經理正在查看的數據。",
      en: "Returns a random buzz adjective that can be used to demonstrate data being viewed by a manager.",
      ja: "マネージャーが表示しているデータを示すために使用できるランダムな流行形容詞を返します。",
      id: "Mengembalikan kata sifat buzz acak yang dapat digunakan untuk menunjukkan data yang dilihat oleh manajer.",
    },
    params: {},
  },
  {
    module: "Company",
    function: "buzzNoun",
    description: {
      "zh-CN": "返回一个随机的流行名词，可以用来展示经理正在查看的数据。",
      "zh-TW": "返回一個隨機的流行名詞，可以用來展示經理正在查看的數據。",
      en: "Returns a random buzz noun that can be used to demonstrate data being viewed by a manager.",
      ja: "マネージャーが表示しているデータを示すために使用できるランダムな流行名詞を返します。",
      id: "Mengembalikan kata benda buzz acak yang dapat digunakan untuk menunjukkan data yang dilihat oleh manajer.",
    },
    params: {},
  },
  {
    module: "Company",
    function: "buzzPhrase",
    description: {
      "zh-CN": "生成一个随机的流行短语，可以用来展示经理正在查看的数据。",
      "zh-TW": "生成一個隨機的流行短語，可以用來展示經理正在查看的數據。",
      en: "Generates a random buzz phrase that can be used to demonstrate data being viewed by a manager.",
      ja: "マネージャーが表示しているデータを示すために使用できるランダムな流行フレーズを生成します。",
      id: "Menghasilkan frasa buzz acak yang dapat digunakan untuk menunjukkan data yang dilihat oleh manajer.",
    },
    params: {},
  },
  {
    module: "Company",
    function: "buzzVerb",
    description: {
      "zh-CN": "返回一个随机的流行动词，可以用来展示经理正在查看的数据。",
      "zh-TW": "返回一個隨機的流行動詞，可以用來展示經理正在查看的數據。",
      en: "Returns a random buzz verb that can be used to demonstrate data being viewed by a manager.",
      ja: "マネージャーが表示しているデータを示すために使用できるランダムな流行動詞を返します。",
      id: "Mengembalikan kata kerja buzz acak yang dapat digunakan untuk menunjukkan data yang dilihat oleh manajer.",
    },
    params: {},
  },
  {
    module: "Company",
    function: "catchPhrase",
    description: {
      "zh-CN": "生成一个随机的口号，可以显示给最终用户。",
      "zh-TW": "生成一個隨機的口號，可以顯示給最終用戶。",
      en: "Generates a random catch phrase that can be displayed to an end user.",
      ja: "エンドユーザーに表示できるランダムなキャッチフレーズを生成します。",
      id: "Menghasilkan frasa catchy acak yang dapat ditampilkan kepada pengguna akhir.",
    },
    params: {},
  },
  {
    module: "Company",
    function: "catchPhraseAdjective",
    description: {
      "zh-CN": "返回一个随机的口号形容词，可以显示给最终用户。",
      "zh-TW": "返回一個隨機的口號形容詞，可以顯示給最終用戶。",
      en: "Returns a random catch phrase adjective that can be displayed to an end user.",
      ja: "エンドユーザーに表示できるランダムなキャッチフレーズの形容詞を返します。",
      id: "Mengembalikan kata sifat frasa catchy acak yang dapat ditampilkan kepada pengguna akhir.",
    },
    params: {},
  },
  {
    module: "Company",
    function: "catchPhraseDescriptor",
    description: {
      "zh-CN": "返回一个随机的口号描述词，可以显示给最终用户。",
      "zh-TW": "返回一個隨機的口號描述詞，可以顯示給最終用戶。",
      en: "Returns a random catch phrase descriptor that can be displayed to an end user.",
      ja: "エンドユーザーに表示できるランダムなキャッチフレーズの記述子を返します。",
      id: "Mengembalikan deskriptor frasa catchy acak yang dapat ditampilkan kepada pengguna akhir.",
    },
    params: {},
  },
  {
    module: "Company",
    function: "catchPhraseNoun",
    description: {
      "zh-CN": "返回一个随机的口号名词，可以显示给最终用户。",
      "zh-TW": "返回一個隨機的口號名詞，可以顯示給最終用戶。",
      en: "Returns a random catch phrase noun that can be displayed to an end user.",
      ja: "エンドユーザーに表示できるランダムなキャッチフレーズの名詞を返します。",
      id: "Mengembalikan kata benda frasa catchy acak yang dapat ditampilkan kepada pengguna akhir.",
    },
    params: {},
  },
  {
    module: "Company",
    function: "name",
    description: {
      "zh-CN": "生成一个随机的公司名称。",
      "zh-TW": "生成一個隨機的公司名稱。",
      en: "Generates a random company name.",
      ja: "ランダムな会社名を生成します。",
      id: "Menghasilkan nama perusahaan acak.",
    },
    params: {},
  },
  {
    module: "Database",
    function: "collation",
    description: {
      "zh-CN": "返回一个随机的数据库排序规则。",
      "zh-TW": "返回一個隨機的資料庫排序規則。",
      en: "Returns a random database collation.",
      ja: "ランダムなデータベースの照合順序を返します。",
      id: "Mengembalikan urutan basis data acak.",
    },
    params: {},
  },
  {
    module: "Database",
    function: "column",
    description: {
      "zh-CN": "返回一个随机的数据库列名。",
      "zh-TW": "返回一個隨機的資料庫列名。",
      en: "Returns a random database column name.",
      ja: "ランダムなデータベースの列名を返します。",
      id: "Mengembalikan nama kolom basis data acak.",
    },
    params: {},
  },
  {
    module: "Database",
    function: "engine",
    description: {
      "zh-CN": "返回一个随机的数据库引擎。",
      "zh-TW": "返回一個隨機的資料庫引擎。",
      en: "Returns a random database engine.",
      ja: "ランダムなデータベースエンジンを返します。",
      id: "Mengembalikan mesin basis data acak.",
    },
    params: {},
  },
  {
    module: "Database",
    function: "mongodbObjectId",
    description: {
      "zh-CN": "返回一个MongoDB ObjectId字符串。",
      "zh-TW": "返回一個MongoDB ObjectId字串。",
      en: "Returns a MongoDB ObjectId string.",
      ja: "MongoDBのObjectId文字列を返します。",
      id: "Mengembalikan string ObjectId MongoDB.",
    },
    params: {},
  },
  {
    module: "Database",
    function: "type",
    description: {
      "zh-CN": "返回一个随机的数据库列类型。",
      "zh-TW": "返回一個隨機的資料庫列類型。",
      en: "Returns a random database column type.",
      ja: "ランダムなデータベース列タイプを返します。",
      id: "Mengembalikan jenis kolom basis data acak.",
    },
    params: {},
  },
  {
    module: "Datatype",
    function: "boolean",
    description: {
      "zh-CN": "返回布尔值true或false。",
      "zh-TW": "返回布林值true或false。",
      en: "Returns the boolean value true or false.",
      ja: "真または偽のブール値を返します。",
      id: "Mengembalikan nilai boolean true atau false.",
    },
    params: {
      probability: {
        isrealKey: true,
        type: "number",
        default: 0.5,
        description: {
          "zh-CN": "返回true的概率（[0.00, 1.00]）。",
          "zh-TW": "返回true的機率（[0.00, 1.00]）。",
          en: "The probability of returning true ([0.00, 1.00]).",
          ja: "trueを返す確率（[0.00, 1.00]）。",
          id: "Peluang mengembalikan true ([0.00, 1.00]).",
        },
        precision: 2,
        max: 1,
        min: 0,
      },
    },
  },
  {
    module: "Date",
    function: "anytime",
    description: {
      "zh-CN": "生成一个可以在过去或未来的随机日期。",
      "zh-TW": "生成一個可以在過去或未來的隨機日期。",
      en: "Generates a random date that can be either in the past or in the future.",
      ja: "過去または未来のいずれかのランダムな日付を生成します。",
      id: "Menghasilkan tanggal acak yang dapat berada di masa lalu atau masa depan.",
    },
    params: {
      refDate: {
        isrealKey: true,
        type: "Date",
        default: "",
        description: {
          "zh-CN": "新的生成日期的参考点。",
          "zh-TW": "新的生成日期的參考點。",
          en: "The reference point for the newly generated date.",
          ja: "新しく生成された日付の参照点。",
          id: "Titik referensi untuk tanggal yang baru dihasilkan.",
        },
      },
    },
  },
  {
    module: "Date",
    function: "between",
    description: {
      "zh-CN": "生成一个在给定边界之间的随机日期。",
      "zh-TW": "生成一個在給定邊界之間的隨機日期。",
      en: "Generates a random date between the given boundaries.",
      ja: "指定された境界の間のランダムな日付を生成します。",
      id: "Menghasilkan tanggal acak antara batas yang diberikan.",
    },
    params: {
      from: {
        isrealKey: true,
        type: "Date",
        description: {
          "zh-CN": "早期日期边界。",
          "zh-TW": "早期日期邊界。",
          en: "The early date boundary.",
          ja: "初期の日付境界。",
          id: "Batas tanggal awal.",
        },
      },
      to: {
        isrealKey: true,
        type: "Date",
        description: {
          "zh-CN": "晚期日期边界。",
          "zh-TW": "晚期日期邊界。",
          en: "The late date boundary.",
          ja: "後期の日付境界。",
          id: "Batas tanggal akhir.",
        },
      },
    },
  },
  {
    module: "Date",
    function: "betweens",
    description: {
      "zh-CN": "生成在给定边界之间的随机日期。",
      "zh-TW": "生成在給定邊界之間的隨機日期。",
      en: "Generates random dates between the given boundaries.",
      ja: "指定された境界の間のランダムな日付を生成します。",
      id: "Menghasilkan tanggal acak antara batas yang diberikan.",
    },
    params: {
      count: {
        isrealKey: true,
        type: "number",
        default: 3,
        description: {
          "zh-CN": "要生成的日期数量。",
          "zh-TW": "要生成的日期數量。",
          en: "The number of dates to be generated.",
          ja: "生成する日付の数。",
          id: "Jumlah tanggal yang akan dihasilkan.",
        },
      },
      "count.min": {
        isrealKey: true,
        type: "number",
        default: 1,
        description: {
          "zh-CN": "要生成的日期数量最小值。",
          "zh-TW": "要生成的日期數量最小值。",
          en: "The minimum value of the number of dates to be generated.",
          ja: "生成する日付の数の最小値。",
          id: "Nilai minimum dari jumlah tanggal yang akan dihasilkan.",
        },
        min: 1,
      },
      "count.max": {
        isrealKey: true,
        type: "number",
        default: 5,
        description: {
          "zh-CN": "要生成的日期数量最大值。",
          "zh-TW": "要生成的日期數量最大值。",
          en: "The maximum value of the number of dates to be generated.",
          ja: "生成する日付の数の最大値。",
          id: "Nilai maksimum dari jumlah tanggal yang akan dihasilkan.",
        },
      },
      from: {
        isrealKey: true,
        type: "Date",
        description: {
          "zh-CN": "早期日期边界。",
          "zh-TW": "早期日期邊界。",
          en: "The early date boundary.",
          ja: "初期の日付境界。",
          id: "Batas tanggal awal.",
        },
      },
      to: {
        isrealKey: true,
        type: "Date",
        description: {
          "zh-CN": "晚期日期边界。",
          "zh-TW": "晚期日期邊界。",
          en: "The late date boundary.",
          ja: "後期の日付境界。",
          id: "Batas tanggal akhir.",
        },
      },
    },
  },
  {
    module: "Date",
    function: "birthdate",
    description: {
      "zh-CN": "返回一个随机的出生日期。",
      "zh-TW": "返回一個隨機的出生日期。",
      en: "Returns a random birthdate.",
      ja: "ランダムな誕生日を返します。",
      id: "Mengembalikan tanggal lahir acak.",
    },
    params: {
      refDate: {
        isrealKey: true,
        type: "Date",
        default: "faker.defaultRefDate()",
        description: {
          "zh-CN": "新的生成日期的参考点。",
          "zh-TW": "新的生成日期的參考點。",
          en: "The reference point for the newly generated date.",
          ja: "新しく生成された日付の参照点。",
          id: "Titik referensi untuk tanggal yang baru dihasilkan.",
        },
      },
      max: {
        isrealKey: true,
        type: "number",
        default: "",
        description: {
          "zh-CN": "生成出生日期的最大年龄/年份。",
          "zh-TW": "生成出生日期的最大年齡/年份。",
          en: "The maximum age/year for generating the date of birth.",
          ja: "生年月日を生成するための最大年齢/年数。",
          id: "Usia/tahun maksimum untuk menghasilkan tanggal lahir.",
        },
        min: 0,
      },
      min: {
        isrealKey: true,
        type: "number",
        default: "",
        description: {
          "zh-CN": "生成出生日期的最小年龄/年份。",
          "zh-TW": "生成出生日期的最小年齡/年份。",
          en: "The minimum age/year for generating the date of birth.",
          ja: "生年月日を生成するための最小年齢/年数。",
          id: "Usia/tahun minimum untuk menghasilkan tanggal lahir.",
        },
        min: 0,
      },
      mode: {
        isrealKey: true,
        type: "enum(age|year)",
        default: "",
        description: {
          "zh-CN": "根据年龄或年份范围生成出生日期。",
          "zh-TW": "根據年齡或年份範圍生成出生日期。",
          en: "Generate the date of birth based on the age or year range.",
          ja: "年齢または年の範囲に基づいて生年月日を生成する。",
          id: "Hasilkan tanggal lahir berdasarkan rentang usia atau tahun.",
        },
      },
    },
  },
  {
    module: "Date",
    function: "future",
    description: {
      "zh-CN": "生成一个随机的未来日期。",
      "zh-TW": "生成一個隨機的未來日期。",
      en: "Generates a random date in the future.",
      ja: "未来の日付をランダムに生成します。",
      id: "Menghasilkan tanggal acak di masa depan.",
    },
    params: {
      refDate: {
        isrealKey: true,
        type: "Date",
        default: "",
        description: {
          "zh-CN": "新的生成日期的参考点。",
          "zh-TW": "新的生成日期的參考點。",
          en: "The reference point for the newly generated date.",
          ja: "新しく生成された日付の参照点。",
          id: "Titik referensi untuk tanggal yang baru dihasilkan.",
        },
      },
      years: {
        isrealKey: true,
        type: "number",
        default: 1,
        description: {
          "zh-CN": "日期可能在未来的年份范围。",
          "zh-TW": "日期可能在未來的年份範圍。",
          en: "The range of years in which the date may be in the future.",
          ja: "日付が未来にある可能性のある年の範囲。",
          id: "Rentang tahun di mana tanggal mungkin berada di masa depan.",
        },
        min: 0,
      },
    },
  },
  {
    module: "Date",
    function: "month",
    description: {
      "zh-CN": "返回一个随机的月份名称。",
      "zh-TW": "返回一個隨機的月份名稱。",
      en: "Returns a random name of a month.",
      ja: "ランダムな月の名前を返します。",
      id: "Mengembalikan nama bulan acak.",
    },
    params: {
      abbreviated: {
        isrealKey: true,
        type: "boolean",
        default: false,
        description: {
          "zh-CN": "是否返回一个缩写。",
          "zh-TW": "是否返回一個縮寫。",
          en: "Whether to return an abbreviation.",
          ja: "省略形を返すかどうか。",
          id: "Apakah mengembalikan singkatan.",
        },
      },
      context: {
        isrealKey: true,
        type: "boolean",
        default: false,
        description: {
          "zh-CN":
            "是否在日期上下文中返回月份名称。在默认en区域中对此没有影响，但在fr或ru等其他区域可能会影响语法或大小写，例如中文的效果。",
          "zh-TW":
            "是否在日期上下文中返回月份名稱。在預設en區域中對此沒有影響，但在fr或ru等其他區域可能會影響語法或大小寫，例如中文的效果。",
          en: "Whether to return the month names in the date context. This has no impact in the default en locale, but may affect grammar or case in other locales such as fr or ru, similar to the effect in Chinese.",
          ja: "日付のコンテキストで月名を返すかどうか。デフォルトのenロケールではこれに影響はないが、frやruなどの他のロケールでは文法や大文字小文字に影響を与える可能性があり、例えば中国語の効果のように。",
          id: "Apakah mengembalikan nama bulan dalam konteks tanggal. Ini tidak memiliki dampak pada lokal en default, tetapi mungkin mempengaruhi tata bahasa atau huruf besar dan kecil di lokal lain seperti fr atau ru, seperti efeknya pada bahasa Cina.",
        },
      },
    },
  },
  {
    module: "Date",
    function: "past",
    description: {
      "zh-CN": "生成一个随机的过去日期。",
      "zh-TW": "生成一個隨機的過去日期。",
      en: "Generates a random date in the past.",
      ja: "過去の日付をランダムに生成します。",
      id: "Menghasilkan tanggal acak di masa lalu.",
    },
    params: {
      refDate: {
        isrealKey: true,
        type: "Date",
        default: "",
        description: {
          "zh-CN": "新的生成日期的参考点。",
          "zh-TW": "新的生成日期的參考點。",
          en: "The reference point for the newly generated date.",
          ja: "新しく生成された日付の参照点。",
          id: "Titik referensi untuk tanggal yang baru dihasilkan.",
        },
      },
      years: {
        isrealKey: true,
        type: "number",
        default: 1,
        description: {
          "zh-CN": "日期可能在过去的年份范围。",
          "zh-TW": "日期可能在過去的年份範圍。",
          en: "The range of years in which the date may be in the past.",
          ja: "日付が過去にある可能性のある年の範囲。",
          id: "Rentang tahun di mana tanggal mungkin berada di masa lalu.",
        },
        min: 0,
      },
    },
  },
  {
    module: "Date",
    function: "recent",
    description: {
      "zh-CN": "生成一个在最近过去的随机日期。",
      "zh-TW": "生成一個在最近過去的隨機日期。",
      en: "Generates a random date in the recent past.",
      ja: "最近の過去の日付をランダムに生成します。",
      id: "Menghasilkan tanggal acak di masa lalu yang baru-baru ini.",
    },
    params: {
      days: {
        isrealKey: true,
        type: "number",
        default: 1,
        description: {
          "zh-CN": "日期可能在过去的天数范围。",
          "zh-TW": "日期可能在過去的天數範圍。",
          en: "The range of days in which the date may be in the past.",
          ja: "日付が過去にある可能性のある日数の範囲。",
          id: "Rentang hari di mana tanggal mungkin berada di masa lalu.",
        },
        min: 1,
      },
      refDate: {
        isrealKey: true,
        type: "Date",
        default: "",
        description: {
          "zh-CN": "新的生成日期的参考点。",
          "zh-TW": "新的生成日期的參考點。",
          en: "The reference point for the newly generated date.",
          ja: "新しく生成された日付の参照点。",
          id: "Titik referensi untuk tanggal yang baru dihasilkan.",
        },
      },
    },
  },
  {
    module: "Date",
    function: "soon",
    description: {
      "zh-CN": "生成一个在不久的将来的随机日期。",
      "zh-TW": "生成一個在不久的將來的隨機日期。",
      en: "Generates a random date in the near future.",
      ja: "近い将来の日付をランダムに生成します。",
      id: "Menghasilkan tanggal acak di masa depan yang dekat.",
    },
    params: {
      days: {
        isrealKey: true,
        type: "number",
        default: 1,
        description: {
          "zh-CN": "日期可能在未来的天数范围。",
          "zh-TW": "日期可能在未來的天數範圍。",
          en: "The range of days in which the date may be in the future.",
          ja: "日付が未来にある可能性のある日数の範囲。",
          id: "Rentang hari di mana tanggal mungkin berada di masa depan.",
        },
        min: 0,
      },
      refDate: {
        isrealKey: true,
        type: "Date",
        default: "",
        description: {
          "zh-CN": "新的生成日期的参考点。",
          "zh-TW": "新的生成日期的參考點。",
          en: "The reference point for the newly generated date.",
          ja: "新しく生成された日付の参照点。",
          id: "Titik referensi untuk tanggal yang baru dihasilkan.",
        },
      },
    },
  },
  {
    module: "Date",
    function: "timeZone",
    description: {
      "zh-CN": "返回一个随机的IANA时区名称。",
      "zh-TW": "返回一個隨機的IANA時區名稱。",
      en: "Returns a random IANA time zone name.",
      ja: "ランダムなIANAタイムゾーン名を返します。",
      id: "Mengembalikan nama zona waktu IANA acak.",
    },
    params: {},
  },
  {
    module: "Date",
    function: "weekday",
    description: {
      "zh-CN": "返回一个随机的星期几。",
      "zh-TW": "返回一個隨機的星期幾。",
      en: "Returns a random day of the week.",
      ja: "ランダムな曜日を返します。",
      id: "Mengembalikan hari acak dalam seminggu.",
    },
    params: {
      abbreviated: {
        isrealKey: true,
        type: "boolean",
        default: false,
        description: {
          "zh-CN": "是否返回一个缩写。",
          "zh-TW": "是否返回一個縮寫。",
          en: "Whether to return an abbreviation.",
          ja: "省略形を返すかどうか。",
          id: "Apakah mengembalikan singkatan.",
        },
      },
      context: {
        isrealKey: true,
        type: "boolean",
        default: false,
        description: {
          "zh-CN": "是否在日期上下文中返回星期几。",
          "zh-TW": "是否在日期上下文中返回星期幾。",
          en: "Whether to return the day of the week in the date context.",
          ja: "日付のコンテキストで曜日を返すかどうか。",
          id: "Apakah mengembalikan hari dalam konteks tanggal.",
        },
      },
    },
  },
  {
    module: "Finance",
    function: "accountName",
    description: {
      "zh-CN": "生成一个随机的账户名称。",
      "zh-TW": "生成一個隨機的帳戶名稱。",
      en: "Generates a random account name.",
      ja: "ランダムなアカウント名を生成します。",
      id: "Menghasilkan nama akun acak.",
    },
    params: {},
  },
  {
    module: "Finance",
    function: "accountNumber",
    description: {
      "zh-CN": "生成一个随机的账户号码。",
      "zh-TW": "生成一個隨機的帳戶號碼。",
      en: "Generates a random account number.",
      ja: "ランダムなアカウント番号を生成します。",
      id: "Menghasilkan nomor rekening acak.",
    },
    params: {
      length: {
        isrealKey: true,
        type: "number",
        default: 8,
        description: {
          "zh-CN": "账户号码的长度。",
          "zh-TW": "帳戶號碼的長度。",
          en: "The length of the account number.",
          ja: "口座番号の長さ。",
          id: "Panjang nomor rekening.",
        },
        min: 1,
      },
    },
  },
  {
    module: "Finance",
    function: "amount",
    description: {
      "zh-CN": "生成一个在给定边界之间的随机金额（包含）。",
      "zh-TW": "生成一個在給定邊界之間的隨機金額（包含）。",
      en: "Generates a random amount between the given bounds (inclusive).",
      ja: "指定された範囲の間のランダムな金額を生成します（含む）。",
      id: "Menghasilkan jumlah acak antara batas yang diberikan (inklusif).",
    },
    params: {
      autoFormat: {
        isrealKey: true,
        type: "boolean",
        default: false,
        description: {
          "zh-CN":
            "如果为真，此方法将使用Number.toLocaleString()。否则，它将使用Number.toFixed()。",
          "zh-TW":
            "如果為真，此方法將使用Number.toLocaleString()。否則，它將使用Number.toFixed()。",
          en: "If true, this method will use Number.toLocaleString(). Otherwise, it will use Number.toFixed().",
          ja: "真の場合、このメソッドはNumber.toLocaleString()を使用します。そうでない場合、Number.toFixed()を使用します。",
          id: "Jika benar, metode ini akan menggunakan Number.toLocaleString(). Jika tidak, akan menggunakan Number.toFixed().",
        },
      },
      dec: {
        isrealKey: true,
        type: "number",
        default: 2,
        description: {
          "zh-CN": "金额的小数位数。",
          "zh-TW": "金額的小數位數。",
          en: "The number of decimal places for the amount.",
          ja: "金額の小数点以下の桁数。",
          id: "Jumlah digit di belakang koma untuk jumlah uang.",
        },
      },
      max: {
        isrealKey: true,
        type: "number",
        default: 1000,
        description: {
          "zh-CN": "金额的上限。",
          "zh-TW": "金額的上限。",
          en: "The upper limit of the amount.",
          ja: "金額の上限。",
          id: "Batas atas jumlah uang.",
        },
      },
      min: {
        isrealKey: true,
        type: "number",
        default: 0,
        description: {
          "zh-CN": "金额的下限。",
          "zh-TW": "金額的下限。",
          en: "The lower limit of the amount.",
          ja: "金額の下限。",
          id: "Batas bawah jumlah uang.",
        },
      },
      symbol: {
        isrealKey: true,
        type: "string",
        default: "''",
        description: {
          "zh-CN": "用于前缀金额的符号。",
          "zh-TW": "用於前綴金額的符號。",
          en: "The symbol used to prefix the amount.",
          ja: "金額の接頭辞に使用する記号。",
          id: "Simbol yang digunakan untuk awalan jumlah uang.",
        },
      },
    },
  },
  {
    module: "Finance",
    function: "bic",
    description: {
      "zh-CN": "生成一个基于ISO-9362格式的随机SWIFT/BIC代码。",
      "zh-TW": "生成一個基於ISO-9362格式的隨機SWIFT/BIC代碼。",
      en: "Generates a random SWIFT/BIC code based on the ISO-9362 format.",
      ja: "ISO-9362フォーマットに基づいたランダムなSWIFT/BICコードを生成します。",
      id: "Menghasilkan kode SWIFT/BIC acak berdasarkan format ISO-9362.",
    },
    params: {
      includeBranchCode: {
        isrealKey: true,
        type: "boolean",
        default: "",
        description: {
          "zh-CN": "是否在生成的代码末尾包含三位数的分支代码。",
          "zh-TW": "是否在生成的代碼末尾包含三位數的分支代碼。",
          en: "Whether to include a three-digit branch code at the end of the generated code.",
          ja: "生成されたコードの末尾に3桁の支店コードを含めるかどうか。",
          id: "Apakah akan menyertakan kode cabang tiga digit di akhir kode yang dihasilkan.",
        },
      },
    },
  },
  {
    module: "Finance",
    function: "bitcoinAddress",
    description: {
      "zh-CN": "生成一个随机的比特币地址。",
      "zh-TW": "生成一個隨機的比特幣地址。",
      en: "Generates a random Bitcoin address.",
      ja: "ランダムなビットコインアドレスを生成します。",
      id: "Menghasilkan alamat Bitcoin acak.",
    },
    params: {
      network: {
        isrealKey: true,
        type: "enum(mainnet| testnet)",
        default: "'mainnet'",
        description: {
          "zh-CN": "比特币网络（'mainnet'或'testnet'）。",
          "zh-TW": "比特幣網絡（'mainnet'或'testnet'）。",
          en: "Bitcoin network ('mainnet' or 'testnet').",
          ja: "ビットコインネットワーク（'mainnet'または'testnet'）。",
          id: "Jaringan Bitcoin ('mainnet' atau 'testnet').",
        },
      },
      type: {
        isrealKey: true,
        type: "enum(legacy| segwit | bech32 | taproot)",
        default:
          "faker.helpers.arrayElement(['legacy','segwit','bech32','taproot'])",
        description: {
          "zh-CN":
            "比特币地址类型（'legacy'，'segwit'，'bech32'或'taproot'）。",
          "zh-TW":
            "比特幣地址類型（'legacy'，'segwit'，'bech32'或'taproot'）。",
          en: "Bitcoin address type ('legacy', 'segwit', 'bech32' or 'taproot').",
          ja: "ビットコインのアドレスタイプ（'legacy'、'segwit'、'bech32'または'taproot'）。",
          id: "Tipe alamat Bitcoin ('legacy', 'segwit', 'bech32' atau 'taproot').",
        },
      },
    },
  },
  {
    module: "Finance",
    function: "creditCardCVV",
    description: {
      "zh-CN": "生成一个随机的信用卡CVV。",
      "zh-TW": "生成一個隨機的信用卡CVV。",
      en: "Generates a random credit card CVV.",
      ja: "ランダムなクレジットカードCVVを生成します。",
      id: "Menghasilkan CVV kartu kredit acak.",
    },
    params: {},
  },
  {
    module: "Finance",
    function: "creditCardIssuer",
    description: {
      "zh-CN": "返回一个随机的信用卡发行人。",
      "zh-TW": "返回一個隨機的信用卡發行人。",
      en: "Returns a random credit card issuer.",
      ja: "ランダムなクレジットカード発行者を返します。",
      id: "Mengembalikan penerbit kartu kredit acak.",
    },
    params: {},
  },
  {
    module: "Finance",
    function: "creditCardNumber",
    description: {
      "zh-CN": "生成一个随机的信用卡号码。",
      "zh-TW": "生成一個隨機的信用卡號碼。",
      en: "Generates a random credit card number.",
      ja: "ランダムなクレジットカード番号を生成します。",
      id: "Menghasilkan nomor kartu kredit acak.",
    },
    params: {
      issuer: {
        isrealKey: true,
        type: "string",
        default: " ",
        description: {
          "zh-CN": "发行人的名称（不区分大小写）或用于生成的格式。",
          "zh-TW": "發行人的名稱（不分大小寫）或用於生成的格式。",
          en: "The name of the issuer (case-insensitive) or the format used for generation.",
          ja: "発行人の名称（大文字小文字を区別しない）または生成に使用するフォーマット。",
          id: "Nama penerbit (tidak memperhatikan huruf besar dan kecil) atau format yang digunakan untuk pembuatan.",
        },
      },
    },
  },
  {
    module: "Finance",
    function: "currencyCode",
    description: {
      "zh-CN":
        "返回一个随机的货币代码。（货币的简短文本/缩写，例如美元 -> USD）",
      "zh-TW": "返回一個隨機的貨幣代碼。（貨幣的短文本/縮寫，例如美元 -> USD）",
      en: "Returns a random currency code. (The short text/abbreviation for the currency (e.g. US Dollar -> USD))",
      ja: "ランダムな通貨コードを返します。（通貨の短いテキスト/省略形（例：米ドル -> USD））",
      id: "Mengembalikan kode mata uang acak. (Teks pendek/abreviasi mata uang (mis. Dolar AS -> USD))",
    },
    params: {},
  },
  {
    module: "Finance",
    function: "currencyName",
    description: {
      "zh-CN": "返回一个随机的货币名称。",
      "zh-TW": "返回一個隨機的貨幣名稱。",
      en: "Returns a random currency name.",
      ja: "ランダムな通貨名を返します。",
      id: "Mengembalikan nama mata uang acak.",
    },
    params: {},
  },
  {
    module: "Finance",
    function: "currencySymbol",
    description: {
      "zh-CN": "返回一个随机的货币符号。",
      "zh-TW": "返回一個隨機的貨幣符號。",
      en: "Returns a random currency symbol.",
      ja: "ランダムな通貨シンボルを返します。",
      id: "Mengembalikan simbol mata uang acak.",
    },
    params: {},
  },
  {
    module: "Finance",
    function: "ethereumAddress",
    description: {
      "zh-CN": "创建一个随机的非校验以太坊地址。",
      "zh-TW": "創建一個隨機的非校驗以太坊地址。",
      en: "Creates a random, non-checksum Ethereum address.",
      ja: "ランダムな非チェックサムのEthereumアドレスを作成します。",
      id: "Membuat alamat Ethereum acak yang tidak memiliki checksum.",
    },
    params: {},
  },
  {
    module: "Finance",
    function: "iban",
    description: {
      "zh-CN": "生成一个随机的IBAN。",
      "zh-TW": "生成一個隨機的IBAN。",
      en: "Generates a random iban.",
      ja: "ランダムなIBANを生成します。",
      id: "Menghasilkan IBAN acak.",
    },
    params: {
      countryCode: {
        isrealKey: true,
        type: "string",
        default: "",
        description: {
          "zh-CN": "您要从中生成IBAN的国家代码。如果没有提供，将使用随机国家。",
          "zh-TW": "您要從中生成IBAN的國家代碼。如果沒有提供，將使用隨機國家。",
          en: "The country code from which you want to generate the IBAN. If not provided, a random country will be used.",
          ja: "IBANを生成するための国コード。提供されない場合、ランダムな国が使用されます。",
          id: "Kode negara dari mana Anda ingin menghasilkan IBAN. Jika tidak disediakan, negara acak akan digunakan.",
        },
      },
      formatted: {
        isrealKey: true,
        type: "boolean",
        default: false,
        description: {
          "zh-CN": "决定是否返回生成的IBAN的格式化版本。",
          "zh-TW": "決定是否返回生成的IBAN的格式化版本。",
          en: "Decide whether to return the formatted version of the generated IBAN.",
          ja: "生成されたIBANのフォーマット済みバージョンを返すかどうかを決定する。",
          id: "Tentukan apakah akan mengembalikan versi IBAN yang telah diformat yang dihasilkan.",
        },
      },
    },
  },
  {
    module: "Finance",
    function: "litecoinAddress",
    description: {
      "zh-CN": "生成一个随机的莱特币地址。",
      "zh-TW": "生成一個隨機的萊特幣地址。",
      en: "Generates a random Litecoin address.",
      ja: "ランダムなライトコインアドレスを生成します。",
      id: "Menghasilkan alamat Litecoin acak.",
    },
    params: {},
  },
  {
    module: "Finance",
    function: "maskedNumber",
    description: {
      "zh-CN": "生成一个随机的掩码号码。",
      "zh-TW": "生成一個隨機的掩碼號碼。",
      en: "Generates a random masked number.",
      ja: "ランダムなマスキングされた番号を生成します。",
      id: "Menghasilkan nomor bertopeng acak.",
    },
    params: {
      ellipsis: {
        isrealKey: true,
        type: "boolean",
        default: true,
        description: {
          "zh-CN": "是否在数字前加省略号。",
          "zh-TW": "是否在數字前加省略號。",
          en: "Whether to add an ellipsis before the number.",
          ja: "数字の前に省略記号を付けるかどうか。",
          id: "Apakah menambahkan tanda ellipsis sebelum angka.",
        },
      },
      length: {
        isrealKey: true,
        type: "number",
        default: 4,
        description: {
          "zh-CN": "未掩码号码的长度。",
          "zh-TW": "未遮罩號碼的長度。",
          en: "The length of the unmasked number.",
          ja: "マスクされていない番号の長さ。",
          id: "Panjang nomor yang tidak tertutup.",
        },
      },
      parens: {
        isrealKey: true,
        type: "boolean",
        default: true,
        description: {
          "zh-CN": "是否使用括号包围。",
          "zh-TW": "是否使用括號包圍。",
          en: "Whether to use parentheses to enclose.",
          ja: "括弧で囲むかどうか。",
          id: "Apakah menggunakan tanda kurung untuk mengelilingi.",
        },
      },
    },
  },
  {
    module: "Finance",
    function: "pin",
    description: {
      "zh-CN": "生成一个随机的PIN码。",
      "zh-TW": "生成一個隨機的PIN碼。",
      en: "Generates a random PIN number.",
      ja: "ランダムなPIN番号を生成します。",
      id: "Menghasilkan nomor PIN acak.",
    },
    params: {
      length: {
        isrealKey: true,
        type: "number",
        default: 4,
        description: {
          "zh-CN": "要生成的PIN的长度。",
          "zh-TW": "要生成的PIN的長度。",
          en: "The length of the PIN to be generated.",
          ja: "生成するPINの長さ。",
          id: "Panjang PIN yang akan dihasilkan.",
        },
      },
    },
  },
  {
    module: "Finance",
    function: "routingNumber",
    description: {
      "zh-CN": "生成一个随机的路由号码。",
      "zh-TW": "生成一個隨機的路由號碼。",
      en: "Generates a random routing number.",
      ja: "ランダムなルーティング番号を生成します。",
      id: "Menghasilkan nomor routing acak.",
    },
    params: {},
  },
  {
    module: "Finance",
    function: "transactionDescription",
    description: {
      "zh-CN": "生成一个随机的交易描述。",
      "zh-TW": "生成一個隨機的交易描述。",
      en: "Generates a random transaction description.",
      ja: "ランダムな取引の説明を生成します。",
      id: "Menghasilkan deskripsi transaksi acak.",
    },
    params: {},
  },
  {
    module: "Finance",
    function: "transactionType",
    description: {
      "zh-CN": "返回一个随机的交易类型。",
      "zh-TW": "返回一個隨機的交易類型。",
      en: "Returns a random transaction type.",
      ja: "ランダムな取引種類を返します。",
      id: "Mengembalikan jenis transaksi acak.",
    },
    params: {},
  },
  {
    module: "Food",
    function: "adjective",
    description: {
      "zh-CN": "生成一个随机的菜肴形容词。",
      "zh-TW": "生成一個隨機的菜餚形容詞。",
      en: "Generates a random dish adjective.",
      ja: "ランダムな料理の形容詞を生成します。",
      id: "Menghasilkan kata sifat hidangan acak.",
    },
    params: {},
  },
  {
    module: "Food",
    function: "description",
    description: {
      "zh-CN": "生成一个随机的菜肴描述。",
      "zh-TW": "生成一個隨機的菜餚描述。",
      en: "Generates a random dish description.",
      ja: "ランダムな料理の説明を生成します。",
      id: "Menghasilkan deskripsi hidangan acak.",
    },
    params: {},
  },
  {
    module: "Food",
    function: "dish",
    description: {
      "zh-CN": "生成一个随机的菜肴名称。",
      "zh-TW": "生成一個隨機的菜餚名稱。",
      en: "Generates a random dish name.",
      ja: "ランダムな料理名を生成します。",
      id: "Menghasilkan nama hidangan acak.",
    },
    params: {},
  },
  {
    module: "Food",
    function: "ethnicCategory",
    description: {
      "zh-CN": "生成一个随机的食物民族类别。",
      "zh-TW": "生成一個隨機的食物民族類別。",
      en: "Generates a random food's ethnic category.",
      ja: "ランダムな料理の民族カテゴリーを生成します。",
      id: "Menghasilkan kategori etnik makanan acak.",
    },
    params: {},
  },
  {
    module: "Food",
    function: "fruit",
    description: {
      "zh-CN": "生成一个随机的水果名称。",
      "zh-TW": "生成一個隨機的水果名稱。",
      en: "Generates a random fruit name.",
      ja: "ランダムな果物の名前を生成します。",
      id: "Menghasilkan nama buah acak.",
    },
    params: {},
  },
  {
    module: "Food",
    function: "ingredient",
    description: {
      "zh-CN": "生成一个随机的成分名称。",
      "zh-TW": "生成一個隨機的成分名稱。",
      en: "Generates a random ingredient name.",
      ja: "ランダムな材料名を生成します。",
      id: "Menghasilkan nama bahan acak.",
    },
    params: {},
  },
  {
    module: "Food",
    function: "meat",
    description: {
      "zh-CN": "生成一种随机的肉类。",
      "zh-TW": "生成一種隨機的肉類。",
      en: "Generates a random meat.",
      ja: "ランダムな肉を生成します。",
      id: "Menghasilkan daging acak.",
    },
    params: {},
  },
  {
    module: "Food",
    function: "spice",
    description: {
      "zh-CN": "生成一种随机的香料名称。",
      "zh-TW": "生成一種隨機的香料名稱。",
      en: "Generates a random spice name.",
      ja: "ランダムなスパイス名を生成します。",
      id: "Menghasilkan nama rempah acak.",
    },
    params: {},
  },
  {
    module: "Food",
    function: "vegetable",
    description: {
      "zh-CN": "生成一种随机的蔬菜名称。",
      "zh-TW": "生成一種隨機的蔬菜名稱。",
      en: "Generates a random vegetable name.",
      ja: "ランダムな野菜名を生成します。",
      id: "Menghasilkan nama sayuran acak.",
    },
    params: {},
  },
  {
    module: "Git",
    function: "branch",
    description: {
      "zh-CN": "生成一个随机的分支名称。",
      "zh-TW": "生成一個隨機的分支名稱。",
      en: "Generates a random branch name.",
      ja: "ランダムなブランチ名を生成します。",
      id: "Menghasilkan nama cabang acak.",
    },
    params: {},
  },
  {
    module: "Git",
    function: "commitDate",
    description: {
      "zh-CN": "生成一个git提交的日期字符串，格式与git log相同。",
      "zh-TW": "生成一個git提交的日期字串，格式與git log相同。",
      en: "Generates a date string for a git commit using the same format as git log.",
      ja: "git logと同じ形式でgitコミットのための日付文字列を生成します。",
      id: "Menghasilkan string tanggal untuk commit git menggunakan format yang sama dengan log git.",
    },
    params: {
      refDate: {
        isrealKey: true,
        type: "Date",
        default: " ",
        description: {
          "zh-CN": "用于提交的参考点日期。",
          "zh-TW": "用於提交的參考點日期。",
          en: "The reference point date for submission.",
          ja: "提出用の参照ポイント日付。",
          id: "Tanggal titik referensi untuk pengumpulan.",
        },
      },
    },
  },
  {
    module: "Git",
    function: "commitEntry",
    description: {
      "zh-CN": "生成一个随机的提交条目，如git log中打印的。",
      "zh-TW": "生成一個隨機的提交條目，如git log中打印的。",
      en: "Generates a random commit entry as printed by git log.",
      ja: "git logに表示されるランダムなコミットエントリを生成します。",
      id: "Menghasilkan entri commit acak seperti yang dicetak oleh log git.",
    },
    params: {
      eol: {
        isrealKey: true,
        type: "enum(LF | CRLF)",
        default: "'CRLF'",
        description: {
          "zh-CN": "选择要使用的行结束符。 'LF' = '\\n', 'CRLF' = '\\r\\n'",
          "zh-TW": "選擇要使用的行結束符。 'LF' = '\\n', 'CRLF' = '\\r\\n'",
          en: "Select the line terminator to use. 'LF' = '\\n', 'CRLF' = '\\r\\n'",
          ja: "使用する行末記号を選択します。 'LF' = '\\n', 'CRLF' = '\\r\\n'",
          id: "Pilih simbol penutup baris yang akan digunakan. 'LF' = '\\n', 'CRLF' = '\\r\\n'",
        },
      },
      merge: {
        isrealKey: true,
        type: "boolean",
        default: " ",
        description: {
          "zh-CN": "设置为true以生成合并消息行。",
          "zh-TW": "設置為true以生成合併消息行。",
          en: "Set it to true to generate merged message lines.",
          ja: "マージされたメッセージ行を生成するためにtrueに設定します。",
          id: "Atur menjadi true untuk menghasilkan baris pesan gabungan.",
        },
      },
      refDate: {
        isrealKey: true,
        type: "Date",
        default: "new Date()",
        description: {
          "zh-CN": "用于提交的参考点日期。",
          "zh-TW": "用於提交的參考點日期。",
          en: "The reference point date for submission.",
          ja: "提出用の参照ポイント日付。",
          id: "Tanggal titik referensi untuk pengumpulan.",
        },
      },
    },
  },
  {
    module: "Git",
    function: "commitMessage",
    description: {
      "zh-CN": "生成一个随机的提交消息。",
      "zh-TW": "生成一個隨機的提交消息。",
      en: "Generates a random commit message.",
      ja: "ランダムなコミットメッセージを生成します。",
      id: "Menghasilkan pesan commit acak.",
    },
    params: {},
  },
  {
    module: "Git",
    function: "commitSha",
    description: {
      "zh-CN": "生成一个随机的提交SHA。",
      "zh-TW": "生成一個隨機的提交SHA。",
      en: "Generates a random commit sha.",
      ja: "ランダムなコミットSHAを生成します。",
      id: "Menghasilkan SHA commit acak.",
    },
    params: {
      length: {
        isrealKey: true,
        type: "number",
        default: 40,
        description: {
          "zh-CN": "提交SHA的长度。",
          "zh-TW": "提交SHA的長度。",
          en: "The length of the submitted SHA.",
          ja: "提出されたSHAの長さ。",
          id: "Panjang SHA yang diajukan.",
        },
      },
    },
  },
  {
    module: "Hacker",
    function: "abbreviation",
    description: {
      "zh-CN": "返回一个随机的黑客/IT缩写。",
      "zh-TW": "返回一個隨機的黑客/IT縮寫。",
      en: "Returns a random hacker/IT abbreviation.",
      ja: "ランダムなハッカー/ITの略語を返します。",
      id: "Mengembalikan singkatan hacker/IT acak.",
    },
    params: {},
  },
  {
    module: "Hacker",
    function: "adjective",
    description: {
      "zh-CN": "返回一个随机的黑客/IT形容词。",
      "zh-TW": "返回一個隨機的黑客/IT形容詞。",
      en: "Returns a random hacker/IT adjective.",
      ja: "ランダムなハッカー/ITの形容詞を返します。",
      id: "Mengembalikan kata sifat hacker/IT acak.",
    },
    params: {},
  },
  {
    module: "Hacker",
    function: "ingverb",
    description: {
      "zh-CN":
        "返回一个随机的黑客/IT动词，用于表示持续的动作（例如：hacking）。",
      "zh-TW": "返回一個隨機的黑客/IT動詞，用於持續動作（例如：hacking）。",
      en: "Returns a random hacker/IT verb for continuous actions (en: ing suffix; e.g. hacking).",
      ja: "継続的な動作のためのランダムなハッカー/ITの動詞を返します（例：hacking）。",
      id: "Mengembalikan kata kerja hacker/IT acak untuk tindakan berkelanjutan (en: akhiran ing; misalnya, hacking).",
    },
    params: {},
  },
  {
    module: "Hacker",
    function: "noun",
    description: {
      "zh-CN": "返回一个随机的黑客/IT名词。",
      "zh-TW": "返回一個隨機的黑客/IT名詞。",
      en: "Returns a random hacker/IT noun.",
      ja: "ランダムなハッカー/ITの名詞を返します。",
      id: "Mengembalikan kata benda hacker/IT acak.",
    },
    params: {},
  },
  {
    module: "Hacker",
    function: "phrase",
    description: {
      "zh-CN": "生成一个随机的黑客/IT短语。",
      "zh-TW": "生成一個隨機的黑客/IT短語。",
      en: "Generates a random hacker/IT phrase.",
      ja: "ランダムなハッカー/ITのフレーズを生成します。",
      id: "Menghasilkan frasa hacker/IT acak.",
    },
    params: {},
  },
  {
    module: "Hacker",
    function: "verb",
    description: {
      "zh-CN": "返回一个随机的黑客/IT动词。",
      "zh-TW": "返回一個隨機的黑客/IT動詞。",
      en: "Returns a random hacker/IT verb.",
      ja: "ランダムなハッカー/ITの動詞を返します。",
      id: "Mengembalikan kata kerja hacker/IT acak.",
    },
    params: {},
  },
  {
    module: "Helpers",
    function: "arrayElement",
    description: {
      "zh-CN": "从给定数组中返回随机元素。",
      "zh-TW": "從給定的陣列中返回隨機元素。",
      en: "Returns random element from the given array.",
      ja: "指定された配列からランダムな要素を返します。",
      id: "Mengembalikan elemen acak dari array yang diberikan.",
    },
    params: {
      array: {
        isrealKey: false,
        type: "array",
        default: "['cat', 'dog', 'mouse']",
        description: {
          "zh-CN": "要从中选择值的数组。",
          "zh-TW": "要從中選擇值的陣列。",
          en: "The array to pick the value from.",
          ja: "値を選択するための配列。",
          id: "Array untuk memilih nilai.",
        },
      },
    },
  },
  {
    module: "Helpers",
    function: "arrayElements",
    description: {
      "zh-CN": "从给定数组中以随机顺序返回随机元素的子集。",
      "zh-TW": "從給定的陣列中隨機順序返回隨機元素的子集。",
      en: "Returns a subset with random elements of the given array in random order.",
      ja: "指定された配列のランダムな要素のサブセットをランダムな順序で返します。",
      id: "Mengembalikan subset dengan elemen acak dari array yang diberikan dalam urutan acak.",
    },
    params: {
      array: {
        isrealKey: false,
        type: "array",
        default: "['cat', 'dog', 'mouse']",
        description: {
          "zh-CN": "要从中选择值的数组。",
          "zh-TW": "要從中選擇值的陣列。",
          en: "The array to pick the value from.",
          ja: "値を選択するための配列。",
          id: "Array untuk memilih nilai.",
        },
      },
      max: {
        isrealKey: true,
        type: "number",
        default: "2",
        description: {
          "zh-CN": "要选择的最大元素数量。",
          "zh-TW": "要選擇的最大元素數量。",
          en: "The maximum number of elements to pick.",
          ja: "選択する最大要素数。",
          id: "Jumlah maksimum elemen untuk dipilih.",
        },
      },
      min: {
        isrealKey: true,
        type: "number",
        default: "1",
        description: {
          "zh-CN": "要选择的最小元素数量。",
          "zh-TW": "要選擇的最小元素數量。",
          en: "The minimum number of elements to pick.",
          ja: "選択する最小要素数。",
          id: "Jumlah minimum elemen untuk dipilih.",
        },
      },
    },
  },
  {
    module: "Helpers",
    function: "fromRegExp",
    description: {
      "zh-CN": "生成符合给定正则表达式的字符串。",
      "zh-TW": "生成符合給定正則表達式的字符串。",
      en: "Generates a string matching the given regex like expressions.",
      ja: "指定された正規表現に一致する文字列を生成します。",
      id: "Menghasilkan string yang cocok dengan ekspresi regex yang diberikan.",
    },
    params: {
      pattern: {
        isrealKey: false,
        type: "RegExp",
        default: "[a-d0-6]{2,8}",
        description: {
          "zh-CN": "要生成匹配字符串的模板字符串/正则表达式。",
          "zh-TW": "要生成匹配字符串的模板字符串/正則表達式。",
          en: "The template string/RegExp to generate a matching string for.",
          ja: "一致する文字列を生成するためのテンプレート文字列/正規表現。",
          id: "String/template yang digunakan untuk menghasilkan string yang cocok.",
        },
      },
    },
  },
  {
    module: "Helpers",
    function: "maybe",
    description: {
      "zh-CN": "如果概率检查成功，则返回回调的结果，否则返回未定义。",
      "zh-TW": "如果概率檢查成功，則返回回調的結果，否則返回未定義。",
      en: "Returns the result of the callback if the probability check was successful, otherwise undefined.",
      ja: "確率チェックが成功した場合はコールバックの結果を返し、そうでない場合は未定義を返します。",
      id: "Mengembalikan hasil dari callback jika pemeriksaan probabilitas berhasil, jika tidak, undefined.",
    },
    params: {
      callback: {
        isrealKey: false,
        type: "function",
        default: "Hello World!",
        description: {
          "zh-CN": "如果概率检查成功，将调用的回调。",
          "zh-TW": "如果概率檢查成功，將調用的回調。",
          en: "The callback to that will be invoked if the probability check was successful.",
          ja: "確率チェックが成功した場合に呼び出されるコールバック。",
          id: "Callback yang akan dipanggil jika pemeriksaan probabilitas berhasil.",
        },
      },
      probability: {
        isrealKey: true,
        type: "number",
        default: "0.5",
        min: 0,
        max: 1,
        precision: 2,
        description: {
          "zh-CN": "回调被调用的概率（[0.00, 1.00]）。",
          "zh-TW": "回調被調用的概率（[0.00, 1.00]）。",
          en: "The probability ([0.00, 1.00]) of the callback being invoked.",
          ja: "コールバックが呼び出される確率（[0.00, 1.00]）。",
          id: "Probabilitas ([0.00, 1.00]) callback dipanggil.",
        },
      },
    },
  },
  {
    module: "Helpers",
    function: "multiple",
    description: {
      "zh-CN": "生成一个包含由给定方法返回值的数组。",
      "zh-TW": "生成一個包含由給定方法返回值的陣列。",
      en: "Generates an array containing values returned by the given method.",
      ja: "指定されたメソッドによって返された値を含む配列を生成します。",
      id: "Menghasilkan array yang berisi nilai yang dikembalikan oleh metode yang diberikan.",
    },
    params: {
      method: {
        isrealKey: false,
        type: "function",
        default: "faker.person.firstName()",
        description: {
          "zh-CN":
            "用于生成值的方法。该方法将以(_, index)为参数调用，以允许在生成的值中使用索引，例如作为id。",
          "zh-TW":
            "用於生成值的方法。該方法將以(_, index)為參數調用，以允許在生成的值中使用索引，例如作為id。",
          en: "The method used to generate the values. The method will be called with (_, index), to allow using the index in the generated value e.g. as id.",
          ja: "値を生成するために使用されるメソッド。このメソッドは(_, index)で呼び出され、生成された値のインデックスを使用できるようにします（例：idとして）。",
          id: "Metode yang digunakan untuk menghasilkan nilai. Metode ini akan dipanggil dengan (_, index), untuk memungkinkan penggunaan index dalam nilai yang dihasilkan misalnya sebagai id.",
        },
      },
      count: {
        isrealKey: true,
        type: "number",
        default: "3",
        description: {
          "zh-CN": "要生成的元素数量或范围。",
          "zh-TW": "要生成的元素數量或範圍。",
          en: "The number or range of elements to generate.",
          ja: "生成する要素の数または範囲。",
          id: "Jumlah atau rentang elemen yang akan dihasilkan.",
        },
      },
      "count.min": {
        isrealKey: true,
        type: "number",
        default: "3",
        description: {
          "zh-CN": "要生成的最小元素数量或范围。",
          "zh-TW": "要生成的最小元素數量或範圍。",
          en: "The minimum number or range of elements to generate.",
          ja: "生成する最小要素の数または範囲。",
          id: "Jumlah atau rentang minimum elemen yang akan dihasilkan.",
        },
      },
      "count.max": {
        isrealKey: true,
        type: "number",
        default: "3",
        description: {
          "zh-CN": "要生成的最大元素数量或范围。",
          "zh-TW": "要生成的最大元素數量或範圍。",
          en: "The maximum number or range of elements to generate.",
          ja: "生成する最大要素の数または範囲。",
          id: "Jumlah atau rentang maksimum elemen yang akan dihasilkan.",
        },
      },
    },
  },
  {
    module: "Helpers",
    function: "rangeToNumber",
    description: {
      "zh-CN": "将给定数字或范围转换为数字的辅助方法。",
      "zh-TW": "將給定數字或範圍轉換為數字的輔助方法。",
      en: "Helper method that converts the given number or range to a number.",
      ja: "指定された数値または範囲を数値に変換するヘルパーメソッド。",
      id: "Metode pembantu yang mengonversi angka atau rentang yang diberikan menjadi angka.",
    },
    params: {
      numberOrRange: {
        isrealKey: false,
        type: "number",
        default: "",
        description: {
          "zh-CN":
            "要转换的数字或范围。选项包括最大值（类型：数字）为范围的最大值。和最小值（类型：数字）为范围的最小值。",
          "zh-TW":
            "要轉換的數字或範圍。選項包括最大值（類型：數字）為範圍的最大值。和最小值（類型：數字）為範圍的最小值。",
          en: "The number or range to convert. Options include max (type: number) which is the maximum value for the range. And min (type: number) which is the minimum value for the range.",
          ja: "変換する数値または範囲。オプションには、範囲の最大値の最大値（タイプ：数値）および範囲の最小値の最小値（タイプ：数値）が含まれます。",
          id: "Angka atau rentang yang akan dikonversi. Opsi termasuk max (tipe: nomor) yang merupakan nilai maksimum untuk rentang. Dan min (tipe: nomor) yang merupakan nilai minimum untuk rentang.",
        },
      },
      max: {
        isrealKey: true,
        type: "number",
        default: "",
        description: {
          "zh-CN": "范围的最大值。",
          "zh-TW": "範圍的最大值。",
          en: "The maximum value for the range.",
          ja: "範囲の最大値。",
          id: "Nilai maksimum untuk rentang.",
        },
      },
      min: {
        isrealKey: true,
        type: "number",
        default: "",
        description: {
          "zh-CN": "范围的最小值。",
          "zh-TW": "範圍的最小值。",
          en: "The minimum value for the range.",
          ja: "範囲の最小値。",
          id: "Nilai minimum untuk rentang.",
        },
      },
    },
  },
  {
    module: "Helpers",
    function: "replaceCreditCardSymbols",
    description: {
      "zh-CN": "替换信用卡模式中的符号和模式，包括Luhn校验和。",
      "zh-TW": "替換信用卡模式中的符號和模式，包括Luhn檢查和。",
      en: "Replaces the symbols and patterns in a credit card schema including Luhn checksum.",
      ja: "Luhnチェックサムを含むクレジットカードスキーマ内の記号とパターンを置き換えます。",
      id: "Mengganti simbol dan pola dalam skema kartu kredit termasuk checksum Luhn.",
    },
    params: {
      string: {
        isrealKey: false,
        type: "string",
        default: "'6453-####-####-####-###L'",
        description: {
          "zh-CN": "信用卡格式模式。",
          "zh-TW": "信用卡格式模式。",
          en: "The credit card format pattern.",
          ja: "クレジットカードの形式パターン。",
          id: "Pola format kartu kredit.",
        },
      },
      symbol: {
        isrealKey: false,
        type: "string",
        default: "'#'",
        description: {
          "zh-CN": "要替换为数字的符号。",
          "zh-TW": "要替換為數字的符號。",
          en: "The symbol to replace with a digit.",
          ja: "数字に置き換える記号。",
          id: "Simbol yang akan diganti dengan digit.",
        },
      },
    },
  },
  {
    module: "Helpers",
    function: "replaceSymbols",
    description: {
      "zh-CN": "逐个解析给定字符串，并适当地替换占位符。",
      "zh-TW": "逐個解析給定字符串，並適當地替換佔位符。",
      en: "Parses the given string symbol by symbols and replaces the placeholder appropriately.",
      ja: "与えられた文字列をシンボルごとに解析し、適切にプレースホルダーを置き換えます。",
      id: "Mengurai string yang diberikan simbol demi simbol dan mengganti placeholder dengan tepat.",
    },
    params: {
      string: {
        isrealKey: false,
        type: "string",
        default: " ",
        description: {
          "zh-CN": "要解析的模板字符串。",
          "zh-TW": "要解析的模板字符串。",
          en: "The template string to parse.",
          ja: "解析するテンプレート文字列。",
          id: "String template yang akan diurai.",
        },
      },
    },
  },
  {
    module: "Helpers",
    function: "shuffle",
    description: {
      "zh-CN": "返回数组的随机化版本。",
      "zh-TW": "返回陣列的隨機化版本。",
      en: "Returns a randomized version of the array.",
      ja: "配列のランダム化されたバージョンを返します。",
      id: "Mengembalikan versi acak dari array.",
    },
    params: {
      list: {
        isrealKey: false,
        type: "array",
        default: "['a', 'b', 'c']",
        description: {
          "zh-CN": "要随机化的数组。",
          "zh-TW": "要隨機化的陣列。",
          en: "The array to shuffle.",
          ja: "シャッフルする配列。",
          id: "Array yang akan diacak.",
        },
      },
      inplace: {
        isrealKey: true,
        type: "boolean",
        default: "false",
        description: {
          "zh-CN": "是否就地随机化数组或返回新数组。",
          "zh-TW": "是否就地隨機化陣列或返回新陣列。",
          en: "Whether to shuffle the array in place or return a new array.",
          ja: "配列をその場でシャッフルするか、新しい配列を返すか。",
          id: "Apakah akan mengacak array di tempat atau mengembalikan array baru.",
        },
      },
    },
  },
  {
    module: "Helpers",
    function: "slugify",
    description: {
      "zh-CN":
        "将给定字符串转换为slug格式。所有空格替换为短横线（-），大多数非单词字符（除了点和短横线）将被移除。",
      "zh-TW":
        "將給定字串轉換為slug格式。所有空格替換為短橫線（-），大多數非單字字符（除了點和短橫線）將被移除。",
      en: "Slugifies the given string. For that all spaces are replaced by hyphens (-) and most non word characters except for dots and hyphens will be removed.",
      ja: "与えられた文字列をスラグ形式に変換します。すべてのスペースはハイフン（-）に置き換えられ、大半の非単語文字はドットやハイフンを除いて削除されます。",
      id: "Mengubah string yang diberikan menjadi format slug. Untuk itu, semua spasi diganti dengan tanda hubung (-) dan sebagian besar karakter non-kata kecuali titik dan tanda hubung akan dihapus.",
    },
    params: {
      string: {
        isrealKey: false,
        type: "string",
        default: " ",
        description: {
          "zh-CN": "要转换为slug的输入内容。",
          "zh-TW": "要轉換為slug的輸入內容。",
          en: "The input to slugify.",
          ja: "スラグにするための入力。",
          id: "Input yang akan diambil slug.",
        },
      },
    },
  },
  {
    module: "Helpers",
    function: "uniqueArray",
    description: {
      "zh-CN":
        "接受字符串数组或返回字符串的函数，并根据该来源输出唯一的字符串数组。",
      "zh-TW": "接受字串陣列或返回字串的函數，並根據該來源輸出唯一的字串陣列。",
      en: "Takes an array of strings or function that returns a string and outputs a unique array of strings based on that source.",
      ja: "文字列の配列または文字列を返す関数を受け取り、そのソースに基づいて一意の文字列の配列を出力します。",
      id: "Mengambil array string atau fungsi yang mengembalikan string dan menghasilkan array string unik berdasarkan sumber tersebut.",
    },
    params: {
      source: {
        isrealKey: false,
        type: "array",
        default: "faker.word.sample",
        description: {
          "zh-CN": "要从中选择的字符串或生成字符串的函数。",
          "zh-TW": "要從中選擇的字串或生成字串的函數。",
          en: "The strings to choose from or a function that generates a string.",
          ja: "選択する文字列または文字列を生成する関数。",
          id: "String yang akan dipilih atau fungsi yang menghasilkan string.",
        },
      },
      length: {
        isrealKey: false,
        type: "number",
        default: "",
        description: {
          "zh-CN": "要生成的元素数量。",
          "zh-TW": "要生成的元素數量。",
          en: "The number of elements to generate.",
          ja: "生成する要素の数。",
          id: "Jumlah elemen yang akan dihasilkan.",
        },
      },
    },
  },
  {
    module: "Image",
    function: "avatar",
    description: {
      "zh-CN": "生成一个随机头像图像URL。",
      "zh-TW": "生成一個隨機的頭像圖片URL。",
      en: "Generates a random avatar image url.",
      ja: "ランダムなアバター画像URLを生成します。",
      id: "Menghasilkan URL gambar avatar acak.",
    },
    params: {},
  },
  {
    module: "Image",
    function: "avatarGitHub",
    description: {
      "zh-CN": "生成一个随机的GitHub头像。",
      "zh-TW": "生成一個隨機的GitHub頭像。",
      en: "Generates a random avatar from GitHub.",
      ja: "GitHubからランダムなアバターを生成します。",
      id: "Menghasilkan avatar acak dari GitHub.",
    },
    params: {},
  },
  {
    module: "Image",
    function: "avatarLegacy",
    description: {
      "zh-CN": "从cloudflare-ipfs生成一个随机头像。",
      "zh-TW": "從cloudflare-ipfs生成一個隨機頭像。",
      en: "Generates a random avatar from cloudflare-ipfs.",
      ja: "cloudflare-ipfsからランダムなアバターを生成します。",
      id: "Menghasilkan avatar acak dari cloudflare-ipfs.",
    },
    params: {},
  },
  {
    module: "Image",
    function: "dataUri",
    description: {
      "zh-CN": "生成一个包含URL编码SVG图像或Base64编码SVG图像的随机数据URI。",
      "zh-TW": "生成一個包含URL編碼SVG圖像或Base64編碼SVG圖像的隨機數據URI。",
      en: "Generates a random data uri containing an URL-encoded SVG image or a Base64-encoded SVG image.",
      ja: "URLエンコードされたSVG画像またはBase64エンコードされたSVG画像を含むランダムなデータURIを生成します。",
      id: "Menghasilkan URI data acak yang berisi gambar SVG yang dikodekan URL atau gambar SVG yang dikodekan Base64.",
    },
    params: {
      color: {
        isrealKey: true,
        type: "string",
        default: "faker.color.rgb()",
        description: {
          "zh-CN": "图像的颜色。必须是SVG支持的颜色。",
          "zh-TW": "圖像的顏色。必須是SVG支持的顏色。",
          en: "The color of the image. Must be a color supported by svg.",
          ja: "画像の色。SVGでサポートされている色でなければなりません。",
          id: "Warna gambar. Harus warna yang didukung oleh SVG.",
        },
      },
      height: {
        isrealKey: true,
        type: "number",
        default: "faker.number.int({ min: 1, max: 3999 })",
        min: 1,
        max: 3999,
        description: {
          "zh-CN": "图像的高度。",
          "zh-TW": "圖片的高度。",
          en: "The height of the image.",
          ja: "画像の高さ。",
          id: "Tinggi gambar.",
        },
      },
      type: {
        isrealKey: true,
        type: "enum(svg-uri | svg-base64)",
        default: "svg-uri",
        description: {
          "zh-CN": "要返回的图像类型。包括文件扩展名和所使用的编码。",
          "zh-TW": "要返回的圖像類型。包括文件擴展名和使用的編碼。",
          en: "The type of the image to return. Consisting of the file extension and the used encoding.",
          ja: "返される画像のタイプ。ファイル拡張子と使用されているエンコーディングで構成されています。",
          id: "Tipe gambar yang akan dikembalikan. Terdiri dari ekstensi file dan encoding yang digunakan.",
        },
      },
      width: {
        isrealKey: true,
        type: "number",
        default: "faker.number.int({ min: 1, max: 3999 })",
        min: 1,
        max: 3999,
        description: {
          "zh-CN": "图像的宽度。",
          "zh-TW": "圖片的寬度。",
          en: "The width of the image.",
          ja: "画像の幅。",
          id: "Lebar gambar.",
        },
      },
    },
  },
  {
    module: "Image",
    function: "url",
    description: {
      "zh-CN": "生成一个随机图像URL。",
      "zh-TW": "生成一個隨機圖像URL。",
      en: "Generates a random image url.",
      ja: "ランダムな画像URLを生成します。",
      id: "Menghasilkan URL gambar acak.",
    },
    params: {
      height: {
        isrealKey: true,
        type: "number",
        default: "faker.number.int({ min: 1, max: 3999 })",
        min: 1,
        max: 3999,
        description: {
          "zh-CN": "图像的高度。",
          "zh-TW": "圖片的高度。",
          en: "The height of the image.",
          ja: "画像の高さ。",
          id: "Tinggi gambar.",
        },
      },
      width: {
        isrealKey: true,
        type: "number",
        default: "faker.number.int({ min: 1, max: 3999 })",
        min: 1,
        max: 3999,
        description: {
          "zh-CN": "图像的宽度。",
          "zh-TW": "圖片的寬度。",
          en: "The width of the image.",
          ja: "画像の幅。",
          id: "Lebar gambar.",
        },
      },
    },
  },
  {
    module: "Image",
    function: "urlLoremFlickr",
    description: {
      "zh-CN": "生成一个通过loremflickr提供的随机图像URL。",
      "zh-TW": "生成一個透過loremflickr提供的隨機圖像URL。",
      en: "Generates a random image url provided via loremflickr.",
      ja: "loremflickrを介して提供されるランダムな画像URLを生成します。",
      id: "Menghasilkan URL gambar acak yang disediakan melalui loremflickr.",
    },
    params: {
      category: {
        isrealKey: true,
        type: "string",
        default: "",
        description: {
          "zh-CN": "用于生成图像的类别。",
          "zh-TW": "用於生成圖像的類別。",
          en: "Category to use for the image.",
          ja: "画像に使用するカテゴリ。",
          id: "Kategori yang akan digunakan untuk gambar.",
        },
      },
      height: {
        isrealKey: true,
        type: "number",
        default: "faker.number.int({ min: 1, max: 3999 })",
        min: 1,
        max: 3999,
        description: {
          "zh-CN": "图像的高度。",
          "zh-TW": "圖片的高度。",
          en: "The height of the image.",
          ja: "画像の高さ。",
          id: "Tinggi gambar.",
        },
      },
      width: {
        isrealKey: true,
        type: "number",
        default: "faker.number.int({ min: 1, max: 3999 })",
        min: 1,
        max: 3999,
        description: {
          "zh-CN": "图像的宽度。",
          "zh-TW": "圖片的寬度。",
          en: "The width of the image.",
          ja: "画像の幅。",
          id: "Lebar gambar.",
        },
      },
    },
  },
  {
    module: "Image",
    function: "urlPicsumPhotos",
    description: {
      "zh-CN": "生成一个通过picsum提供的随机图像URL。",
      "zh-TW": "生成一個透過picsum提供的隨機圖像URL。",
      en: "Generates a random image url provided via picsum.",
      ja: "picsumを介して提供されるランダムな画像URLを生成します。",
      id: "Menghasilkan URL gambar acak yang disediakan melalui picsum.",
    },
    params: {
      blur: {
        isrealKey: true,
        type: "enum(0 | 10 | 2 | 1 | 3 | 4 | 5 | 6 | 7 | 8 | 9)",
        default: "faker.number.int({ max: 10 })",
        description: {
          "zh-CN": "图像是否应模糊。0表示禁用模糊。",
          "zh-TW": "圖像是否應模糊。0表示禁用模糊。",
          en: "Whether the image should be blurred. 0 disables the blur.",
          ja: "画像がぼやけるかどうか。0はぼかしを無効にします。",
          id: "Apakah gambar harus diburamkan. 0 menonaktifkan blur.",
        },
      },
      grayscale: {
        isrealKey: true,
        type: "boolean",
        default: "faker.datatype.boolean()",
        description: {
          "zh-CN": "图像是否应为灰度。",
          "zh-TW": "圖像是否應為灰度。",
          en: "Whether the image should be grayscale.",
          ja: "画像がグレースケールであるべきかどうか。",
          id: "Apakah gambar harus dalam skala abu-abu.",
        },
      },
      height: {
        isrealKey: true,
        type: "number",
        default: "faker.number.int({ min: 1, max: 3999 })",
        min: 1,
        max: 3999,
        description: {
          "zh-CN": "图像的高度。",
          "zh-TW": "圖片的高度。",
          en: "The height of the image.",
          ja: "画像の高さ。",
          id: "Tinggi gambar.",
        },
      },
      width: {
        isrealKey: true,
        type: "number",
        default: "faker.number.int({ min: 1, max: 3999 })",
        min: 1,
        max: 3999,
        description: {
          "zh-CN": "图像的宽度。",
          "zh-TW": "圖片的寬度。",
          en: "The width of the image.",
          ja: "画像の幅。",
          id: "Lebar gambar.",
        },
      },
    },
  },
  {
    module: "Image",
    function: "urlPlaceholder",
    description: {
      "zh-CN": "生成一个通过placeholder提供的随机图像URL。",
      "zh-TW": "生成一個透過placeholder提供的隨機圖像URL。",
      en: "Generates a random image url provided via placeholder.",
      ja: "placeholderを介して提供されるランダムな画像URLを生成します。",
      id: "Menghasilkan URL gambar acak yang disediakan melalui placeholder.",
    },
    params: {
      backgroundColor: {
        isrealKey: true,
        type: "string",
        default: "faker.color.rgb({ format: 'hex', prefix: '' })",
        description: {
          "zh-CN": "图像的背景颜色。",
          "zh-TW": "圖片的背景顏色。",
          en: "The background color of the image.",
          ja: "画像の背景色。",
          id: "Warna latar belakang gambar.",
        },
      },
      format: {
        isrealKey: true,
        type: "enum(gif| jpeg | jpg | png | webp)",
        default:
          "faker.helpers.arrayElement(['gif', 'jpeg', 'jpg', 'png', 'webp'])",
        description: {
          "zh-CN": "图像的格式。",
          "zh-TW": "圖片的格式。",
          en: "The format of the image.",
          ja: "画像のフォーマット。",
          id: "Format gambar.",
        },
      },
      height: {
        isrealKey: true,
        type: "number",
        default: "faker.number.int({ min: 1, max: 3999 })",
        min: 1,
        max: 3999,
        description: {
          "zh-CN": "图像的高度。",
          "zh-TW": "圖片的高度。",
          en: "The height of the image.",
          ja: "画像の高さ。",
          id: "Tinggi gambar.",
        },
      },
      text: {
        isrealKey: true,
        type: "string",
        default: "faker.lorem.words()",
        description: {
          "zh-CN": "要显示在图像上的文本。",
          "zh-TW": "要顯示在圖片上的文本。",
          en: "The text to display on the image.",
          ja: "画像に表示するテキスト。",
          id: "Teks yang akan ditampilkan pada gambar.",
        },
      },
      textColor: {
        isrealKey: true,
        type: "string",
        default: "faker.color.rgb({ format: 'hex', prefix: '' })",
        description: {
          "zh-CN": "图像的文本颜色。",
          "zh-TW": "圖片的文本顏色。",
          en: "The text color of the image.",
          ja: "画像のテキストカラー。",
          id: "Warna teks dari gambar.",
        },
      },
      width: {
        isrealKey: true,
        type: "number",
        default: "faker.number.int({ min: 1, max: 3999 })",
        min: 1,
        max: 3999,
        description: {
          "zh-CN": "图像的宽度。",
          "zh-TW": "圖片的寬度。",
          en: "The width of the image.",
          ja: "画像の幅。",
          id: "Lebar gambar.",
        },
      },
    },
  },
  {
    module: "Internet",
    function: "color",
    description: {
      "zh-CN": "生成一个在美观调色板中随机的CSS十六进制颜色代码。",
      "zh-TW": "生成一個在美觀調色板中隨機的CSS十六進制顏色代碼。",
      en: "Generates a random css hex color code in aesthetically pleasing color palette.",
      ja: "美しいカラーパレットでランダムなCSS16進数カラーコードを生成します。",
      id: "Menghasilkan kode warna hex CSS acak dalam palet warna yang estetis menyenangkan.",
    },
    params: {
      blueBase: {
        isrealKey: true,
        type: "number",
        default: 0,
        max: 255,
        description: {
          "zh-CN": "0到255之间的可选蓝色基准。",
          "zh-TW": "0到255之間的可選藍色基準。",
          en: "The optional base blue in range between 0 and 255.",
          ja: "0から255の範囲のオプションの基本青。",
          id: "Dasar biru opsional dalam rentang antara 0 dan 255.",
        },
      },
      greenBase: {
        isrealKey: true,
        type: "number",
        default: 0,
        max: 255,
        description: {
          "zh-CN": "0到255之间的可选绿色基准。",
          "zh-TW": "0到255之間的可選綠色基準。",
          en: "The optional base green in range between 0 and 255.",
          ja: "0から255の範囲のオプションの基本緑。",
          id: "Dasar hijau opsional dalam rentang antara 0 dan 255.",
        },
      },
      redBase: {
        isrealKey: true,
        type: "number",
        default: 0,
        max: 255,
        description: {
          "zh-CN": "0到255之间的可选红色基准。",
          "zh-TW": "0到255之間的可選紅色基準。",
          en: "The optional base red in range between 0 and 255.",
          ja: "0から255の範囲のオプションの基本赤。",
          id: "Dasar merah opsional dalam rentang antara 0 dan 255.",
        },
      },
    },
  },
  {
    module: "Internet",
    function: "displayName",
    description: {
      "zh-CN": "使用给定人员的姓名生成显示名称。",
      "zh-TW": "使用給定人的姓名生成顯示名稱。",
      en: "Generates a display name using the given person's name as base.",
      ja: "与えられた人の名前を基にした表示名を生成します。",
      id: "Menghasilkan nama tampilan menggunakan nama orang yang diberikan sebagai dasar.",
    },
    params: {
      firstName: {
        isrealKey: true,
        type: "string",
        default: "faker.person.firstName()",
        description: {
          "zh-CN": "要使用的可选名字。",
          "zh-TW": "要使用的可選名字。",
          en: "The optional first name to use.",
          ja: "使用するオプションの名前。",
          id: "Nama depan opsional yang akan digunakan.",
        },
      },
      lastName: {
        isrealKey: true,
        type: "string",
        default: "faker.person.lastName()",
        description: {
          "zh-CN": "要使用的可选姓氏。",
          "zh-TW": "要使用的可選姓氏。",
          en: "The optional last name to use.",
          ja: "使用するオプションの姓。",
          id: "Nama belakang opsional yang akan digunakan.",
        },
      },
    },
  },
  {
    module: "Internet",
    function: "domainName",
    description: {
      "zh-CN": "生成一个随机域名。",
      "zh-TW": "生成一個隨機域名。",
      en: "Generates a random domain name.",
      ja: "ランダムなドメイン名を生成します。",
      id: "Menghasilkan nama domain acak.",
    },
    params: {},
  },
  {
    module: "Internet",
    function: "domainSuffix",
    description: {
      "zh-CN": "返回一个随机域名后缀。",
      "zh-TW": "返回一個隨機域名後綴。",
      en: "Returns a random domain suffix.",
      ja: "ランダムなドメインサフィックスを返します。",
      id: "Mengembalikan sufiks domain acak.",
    },
    params: {},
  },
  {
    module: "Internet",
    function: "domainWord",
    description: {
      "zh-CN": "生成一个随机域名单词。",
      "zh-TW": "生成一個隨機域名單字。",
      en: "Generates a random domain word.",
      ja: "ランダムなドメイン単語を生成します。",
      id: "Menghasilkan kata domain acak.",
    },
    params: {},
  },
  {
    module: "Internet",
    function: "email",
    description: {
      "zh-CN": "使用给定人员的姓名生成电子邮件地址。",
      "zh-TW": "使用給定人的姓名生成電子郵件地址。",
      en: "Generates an email address using the given person's name as base.",
      ja: "与えられた人の名前を基にメールアドレスを生成します。",
      id: "Menghasilkan alamat email menggunakan nama orang yang diberikan sebagai dasar.",
    },
    params: {
      allowSpecialCharacters: {
        isrealKey: true,
        type: "boolean",
        default: "false",
        description: {
          "zh-CN": "是否应包括特殊字符，如.!#$%&'*+-/=?^_`{|}~。",
          "zh-TW": "是否應包括特殊字符，如.!#$%&'*+-/=?^_`{|}~。",
          en: "Whether special characters such as.!#$%&'*+-/=?^_`{|}~ should be included in the email address.",
          ja: "メールアドレスに.!#$%&'*+-/=?^_`{|}~のような特殊文字を含めるべきか。",
          id: "Apakah karakter khusus seperti.!#$%&'*+-/=?^_`{|}~ harus disertakan dalam alamat email.",
        },
      },
      firstName: {
        isrealKey: true,
        type: "string",
        default: "faker.person.firstName()",
        description: {
          "zh-CN": "要使用的可选名字。",
          "zh-TW": "要使用的可選名字。",
          en: "The optional first name to use.",
          ja: "使用するオプションの名前。",
          id: "Nama depan opsional yang akan digunakan.",
        },
      },
      lastName: {
        isrealKey: true,
        type: "string",
        default: "faker.person.lastName()",
        description: {
          "zh-CN": "要使用的可选姓氏。",
          "zh-TW": "要使用的可選姓氏。",
          en: "The optional last name to use.",
          ja: "使用するオプションの姓。",
          id: "Nama belakang opsional yang akan digunakan.",
        },
      },
      provider: {
        isrealKey: true,
        type: "string",
        default: "",
        description: {
          "zh-CN":
            "要使用的邮件提供商域名。如果未指定，将选择一个随机的免费邮件提供商。",
          "zh-TW":
            "要使用的郵件提供商域名。如果未指定，將選擇一個隨機的免費郵件提供商。",
          en: "The mail provider domain to use. If not specified, a random free mail provider will be chosen.",
          ja: "使用するメールプロバイダーのドメイン。指定しない場合は、ランダムな無料メールプロバイダーが選択されます。",
          id: "Domain penyedia email yang akan digunakan. Jika tidak ditentukan, penyedia email gratis acak akan dipilih.",
        },
      },
    },
  },
  {
    module: "Internet",
    function: "emoji",
    description: {
      "zh-CN": "生成一个随机的表情符号。",
      "zh-TW": "生成一個隨機的表情符號。",
      en: "Generates a random emoji.",
      ja: "ランダムな絵文字を生成します。",
      id: "Menghasilkan emoji acak.",
    },
    params: {
      types: {
        isrealKey: true,
        type: "enums(smiley | body | person | nature | food | travel | activity | object | symbol | flag)",
        default: " ",
        description: {
          "zh-CN": "应该使用的表情符号类型列表。",
          "zh-TW": "應該使用的表情符號類型列表。",
          en: "A list of the emoji types that should be used.",
          ja: "使用する絵文字の種類のリスト。",
          id: "Daftar jenis emoji yang harus digunakan.",
        },
      },
    },
  },
  {
    module: "Internet",
    function: "exampleEmail",
    description: {
      "zh-CN": "使用示例邮件提供商生成电子邮件地址，以给定人员的姓名作为基础。",
      "zh-TW": "使用示例郵件提供商生成電子郵件地址，以給定人的姓名作為基礎。",
      en: "Generates an email address using an example mail provider using the given person's name as base.",
      ja: "例のメールプロバイダーを使用して、与えられた人の名前を基にしたメールアドレスを生成します。",
      id: "Menghasilkan alamat email menggunakan penyedia email contoh dengan nama orang yang diberikan sebagai dasar.",
    },
    params: {
      allowSpecialCharacters: {
        isrealKey: true,
        type: "boolean",
        default: "false",
        description: {
          "zh-CN": "是否应包括特殊字符，如.!#$%&'*+-/=?^_`{|}~。",
          "zh-TW": "是否應包括特殊字符，如.!#$%&'*+-/=?^_`{|}~。",
          en: "Whether special characters such as.!#$%&'*+-/=?^_`{|}~ should be included in the email address.",
          ja: "メールアドレスに.!#$%&'*+-/=?^_`{|}~のような特殊文字を含めるべきか。",
          id: "Apakah karakter khusus seperti.!#$%&'*+-/=?^_`{|}~ harus disertakan dalam alamat email.",
        },
      },
      firstName: {
        isrealKey: true,
        type: "string",
        default: "faker.person.firstName()",
        description: {
          "zh-CN": "要使用的可选名字。",
          "zh-TW": "要使用的可選名字。",
          en: "The optional first name to use.",
          ja: "使用するオプションの名前。",
          id: "Nama depan opsional yang akan digunakan.",
        },
      },
      lastName: {
        isrealKey: true,
        type: "string",
        default: "faker.person.lastName()",
        description: {
          "zh-CN": "要使用的可选姓氏。",
          "zh-TW": "要使用的可選姓氏。",
          en: "The optional last name to use.",
          ja: "使用するオプションの姓。",
          id: "Nama belakang opsional yang akan digunakan.",
        },
      },
    },
  },
  {
    module: "Internet",
    function: "httpMethod",
    description: {
      "zh-CN": "返回一个随机的HTTP方法。",
      "zh-TW": "返回一個隨機的HTTP方法。",
      en: "Returns a random http method.",
      ja: "ランダムなHTTPメソッドを返します。",
      id: "Mengembalikan metode http acak.",
    },
    params: {},
  },
  {
    module: "Internet",
    function: "httpStatusCode",
    description: {
      "zh-CN": "生成一个随机HTTP状态码。",
      "zh-TW": "生成一個隨機HTTP狀態碼。",
      en: "Generates a random HTTP status code.",
      ja: "ランダムなHTTPステータスコードを生成します。",
      id: "Menghasilkan kode status HTTP acak.",
    },
    params: {
      types: {
        isrealKey: true,
        type: "enums(informational | success | clientError | serverError | redirection)",
        default: "Object.keys(faker.definitions.internet.http_status_code)",
        description: {
          "zh-CN": "应该使用的HTTP状态码类型列表。",
          "zh-TW": "應該使用的HTTP狀態碼類型列表。",
          en: "A list of the HTTP status code types that should be used.",
          ja: "使用するHTTPステータスコードタイプのリスト。",
          id: "Daftar jenis kode status HTTP yang harus digunakan.",
        },
      },
    },
  },
  {
    module: "Internet",
    function: "ip",
    description: {
      "zh-CN": "生成一个随机IPv4或IPv6地址。",
      "zh-TW": "生成一個隨機IPv4或IPv6地址。",
      en: "Generates a random IPv4 or IPv6 address.",
      ja: "ランダムなIPv4またはIPv6アドレスを生成します。",
      id: "Menghasilkan alamat IPv4 atau IPv6 acak.",
    },
    params: {},
  },
  {
    module: "Internet",
    function: "ipv4",
    description: {
      "zh-CN": "生成一个随机IPv4地址。",
      "zh-TW": "生成一個隨機IPv4地址。",
      en: "Generates a random IPv4 address.",
      ja: "ランダムなIPv4アドレスを生成します。",
      id: "Menghasilkan alamat IPv4 acak.",
    },
    params: {
      cidrBlock: {
        isrealKey: true,
        type: "string",
        default: "'0.0.0.0/0'",
        description: {
          "zh-CN": "要使用的可选CIDR块。必须采用x.x.x.x/y格式。",
          "zh-TW": "要使用的可選CIDR區塊。必須採用x.x.x.x/y格式。",
          en: "The optional CIDR block to use. Must be in the format x.x.x.x/y.",
          ja: "使用するオプションのCIDRブロック。x.x.x.x/y形式である必要があります。",
          id: "Blok CIDR opsional yang akan digunakan. Harus dalam format x.x.x.x/y.",
        },
      },
      network: {
        isrealKey: true,
        type: "enum(any | loopback | private-a | private-b | private-c | test-net-1 | test-net-2 | test-net-3 | link-local | multicast)",
        default: "any",
        description: {
          "zh-CN": "要使用的可选网络。这是已知CIDR块的别名。",
          "zh-TW": "要使用的可選網路。這是已知CIDR區塊的別名。",
          en: "The optional network to use. This is intended as an alias for well-known cidrBlocks.",
          ja: "使用するオプションのネットワーク。これは、よく知られたCIDRブロックのエイリアスとして意図されています。",
          id: "Jaringan opsional yang akan digunakan. Ini dimaksudkan sebagai alias untuk cidrBlocks yang dikenal.",
        },
      },
    },
  },
  {
    module: "Internet",
    function: "ipv6",
    description: {
      "zh-CN": "生成一个随机IPv6地址。",
      "zh-TW": "生成一個隨機IPv6地址。",
      en: "Generates a random IPv6 address.",
      ja: "ランダムなIPv6アドレスを生成します。",
      id: "Menghasilkan alamat IPv6 acak.",
    },
    params: {},
  },
  {
    module: "Internet",
    function: "jwtAlgorithm",
    description: {
      "zh-CN": "生成一个随机JWT（JSON Web Token）算法。",
      "zh-TW": "生成一個隨機JWT（JSON Web Token）算法。",
      en: "Generates a random JWT (JSON Web Token) Algorithm.",
      ja: "ランダムなJWT（JSON Web Token）アルゴリズムを生成します。",
      id: "Menghasilkan Algoritma JWT (JSON Web Token) acak.",
    },
    params: {},
  },
  {
    module: "Internet",
    function: "mac",
    description: {
      "zh-CN": "生成一个随机MAC地址。",
      "zh-TW": "生成一個隨機MAC地址。",
      en: "Generates a random mac address.",
      ja: "ランダムなMACアドレスを生成します。",
      id: "Menghasilkan alamat MAC acak.",
    },
    params: {
      separator: {
        isrealKey: true,
        type: "string",
        default: ":",
        description: {
          "zh-CN": "可选的分隔符。可以是:、-或''。",
          "zh-TW": "可選的分隔符。可以是:、-或''。",
          en: "The optional separator to use. Can be either ':', '-' or ''.",
          ja: "使用するオプションのセパレーター。':'、'-'、または''のいずれかにできます。",
          id: "Pemisah opsional yang akan digunakan. Dapat berupa ':', '-' atau ''.",
        },
      },
    },
  },
  {
    module: "Internet",
    function: "password",
    description: {
      "zh-CN": "生成一个随机密码。",
      "zh-TW": "生成一個隨機密碼。",
      en: "Generates a random password.",
      ja: "ランダムなパスワードを生成します。",
      id: "Menghasilkan kata sandi acak.",
    },
    params: {
      length: {
        isrealKey: true,
        type: "number",
        default: 15,
        description: {
          "zh-CN": "要生成的密码长度。",
          "zh-TW": "要生成的密碼長度。",
          en: "The length of the password to generate.",
          ja: "生成するパスワードの長さ。",
          id: "Panjang kata sandi yang akan dihasilkan.",
        },
      },
      memorable: {
        isrealKey: true,
        type: "boolean",
        default: "false",
        description: {
          "zh-CN": "生成的密码是否应该易记。",
          "zh-TW": "生成的密碼是否應該容易記住。",
          en: "Whether the generated password should be memorable.",
          ja: "生成されるパスワードが記憶しやすいかどうか。",
          id: "Apakah kata sandi yang dihasilkan harus dapat diingat.",
        },
      },
      pattern: {
        isrealKey: true,
        type: "RegExp",
        default: "/\\w/",
        description: {
          "zh-CN":
            "所有字符应匹配的模式。如果memorable为true，则此选项将被忽略。",
          "zh-TW":
            "所有字符應符合的模式。如果memorable為true，則此選項將被忽略。",
          en: "The pattern that all chars should match. This option will be ignored if memorable is true.",
          ja: "すべての文字が一致すべきパターン。このオプションはmemorableがtrueの場合は無視されます。",
          id: "Pola yang harus cocok dengan semua karakter. Opsi ini akan diabaikan jika memorable bernilai true.",
        },
      },
      prefix: {
        isrealKey: true,
        type: "string",
        default: "",
        description: {
          "zh-CN": "要使用的前缀。",
          "zh-TW": "要使用的前綴。",
          en: "The prefix to use.",
          ja: "使用するプレフィックス。",
          id: "Prefiks yang akan digunakan.",
        },
      },
    },
  },
  {
    module: "Internet",
    function: "port",
    description: {
      "zh-CN": "生成一个随机端口号。",
      "zh-TW": "生成一個隨機端口號。",
      en: "Generates a random port number.",
      ja: "ランダムなポート番号を生成します。",
      id: "Menghasilkan nomor port acak.",
    },
    params: {},
  },
  {
    module: "Internet",
    function: "protocol",
    description: {
      "zh-CN": "返回一个随机的网络协议。可以是http或https。",
      "zh-TW": "返回一個隨機的網路協議。可以是http或https。",
      en: "Returns a random web protocol. Either http or https.",
      ja: "ランダムなウェブプロトコルを返します。httpまたはhttpsのいずれか。",
      id: "Mengembalikan protokol web acak. Bisa jadi http atau https.",
    },
    params: {},
  },
  {
    module: "Internet",
    function: "url",
    description: {
      "zh-CN": "生成一个随机的http(s) URL。",
      "zh-TW": "生成一個隨機的http(s) URL。",
      en: "Generates a random http(s) url.",
      ja: "ランダムなhttp(s) URLを生成します。",
      id: "Menghasilkan URL http(s) acak.",
    },
    params: {
      appendSlash: {
        isrealKey: true,
        type: "boolean",
        default: "faker.datatype.boolean()",
        description: {
          "zh-CN": "是否在URL（路径）的末尾添加一个斜杠。",
          "zh-TW": "是否在URL（路徑）的末尾添加一個斜槓。",
          en: "Whether to append a slash to the end of the url (path).",
          ja: "URLの末尾にスラッシュを追加するかどうか。",
          id: "Apakah akan menambahkan garis miring di akhir URL (path).",
        },
      },
      protocol: {
        isrealKey: true,
        type: "enum(http | https)",
        default: "https",
        description: {
          "zh-CN": "要使用的协议。",
          "zh-TW": "要使用的協議。",
          en: "The protocol to use.",
          ja: "使用するプロトコル。",
          id: "Protokol yang akan digunakan.",
        },
      },
    },
  },
  {
    module: "Internet",
    function: "userAgent",
    description: {
      "zh-CN": "生成一个随机的用户代理字符串。",
      "zh-TW": "生成一個隨機的用戶代理字串。",
      en: "Generates a random user agent string.",
      ja: "ランダムなユーザーエージェント文字列を生成します。",
      id: "Menghasilkan string agen pengguna acak.",
    },
    params: {},
  },
  {
    module: "Internet",
    function: "username",
    description: {
      "zh-CN": "使用给定人员的姓名生成用户名。",
      "zh-TW": "使用給定人的姓名生成帳號名稱。",
      en: "Generates a username using the given person's name as base.",
      ja: "与えられた人の名前を基にユーザー名を生成します。",
      id: "Menghasilkan nama pengguna menggunakan nama orang yang diberikan sebagai dasar.",
    },
    params: {
      firstName: {
        isrealKey: true,
        type: "string",
        default: "faker.person.firstName()",
        description: {
          "zh-CN": "要使用的可选名字。",
          "zh-TW": "要使用的可選名字。",
          en: "The optional first name to use.",
          ja: "使用するオプションのファーストネーム。",
          id: "Nama depan opsional yang akan digunakan.",
        },
      },
      lastName: {
        isrealKey: true,
        type: "string",
        default: "faker.person.lastName()",
        description: {
          "zh-CN": "要使用的可选姓氏。",
          "zh-TW": "要使用的可選姓氏。",
          en: "The optional last name to use.",
          ja: "使用するオプションの姓。",
          id: "Nama belakang opsional yang akan digunakan.",
        },
      },
    },
  },
  {
    module: "Internet",
    function: "userName",
    description: {
      "zh-CN": "使用给定人员的姓名生成用户名。",
      "zh-TW": "使用給定人的姓名生成帳號名稱。",
      en: "Generates a username using the given person's name as base.",
      ja: "与えられた人の名前を基にユーザー名を生成します。",
      id: "Menghasilkan nama pengguna menggunakan nama orang yang diberikan sebagai dasar.",
    },
    params: {
      firstName: {
        isrealKey: true,
        type: "string",
        default: "faker.person.firstName()",
        description: {
          "zh-CN": "要使用的可选名字。",
          "zh-TW": "要使用的可選名字。",
          en: "The optional first name to use.",
          ja: "使用するオプションのファーストネーム。",
          id: "Nama depan opsional yang akan digunakan.",
        },
      },
      lastName: {
        isrealKey: true,
        type: "string",
        default: "faker.person.lastName()",
        description: {
          "zh-CN": "要使用的可选姓氏。",
          "zh-TW": "要使用的可選姓氏。",
          en: "The optional last name to use.",
          ja: "使用するオプションの姓。",
          id: "Nama belakang opsional yang akan digunakan.",
        },
      },
    },
  },
  {
    module: "Location",
    function: "buildingNumber",
    description: {
      "zh-CN": "生成一个随机建筑编号。",
      "zh-TW": "生成一個隨機建築編號。",
      en: "Generates a random building number.",
      ja: "ランダムな建物番号を生成します。",
      id: "Menghasilkan nomor bangunan acak.",
    },
    params: {},
  },
  {
    module: "Location",
    function: "cardinalDirection",
    description: {
      "zh-CN": "返回一个随机的基本方向（北、东、南、西）。",
      "zh-TW": "返回一個隨機的基礎方向（北、東、南、西）。",
      en: "Returns a random cardinal direction (north, east, south, west).",
      ja: "ランダムな基準方向を返します（北、東、南、西）。",
      id: "Mengembalikan arah kardinal acak (utara, timur, selatan, barat).",
    },
    params: {
      abbreviated: {
        isrealKey: true,
        type: "boolean",
        default: "false",
        description: {
          "zh-CN": "如果为true，则返回缩略方向（N、E等）。否则返回完整名称。",
          "zh-TW": "如果為true，則返回縮寫方向（N、E等）。否則返回完整名稱。",
          en: "If true this will return abbreviated directions (N, E, etc). Otherwise this will return the long name.",
          ja: "trueの場合は省略形の方向（N、Eなど）を返し、そうでない場合は長い名前を返します。",
          id: "Jika true, ini akan mengembalikan arah ringkas (N, E, dll). Jika tidak, ini akan mengembalikan nama lengkap.",
        },
      },
    },
  },
  {
    module: "Location",
    function: "city",
    description: {
      "zh-CN": "生成一个随机本地城市名称。",
      "zh-TW": "生成一個隨機本地城市名稱。",
      en: "Generates a random localized city name.",
      ja: "ランダムなローカライズされた都市名を生成します。",
      id: "Menghasilkan nama kota lokal acak.",
    },
    params: {},
  },
  {
    module: "Location",
    function: "continent",
    description: {
      "zh-CN": "返回一个随机大陆名称。",
      "zh-TW": "返回一個隨機大陸名稱。",
      en: "Returns a random continent name.",
      ja: "ランダムな大陸名を返します。",
      id: "Mengembalikan nama benua acak.",
    },
    params: {},
  },
  {
    module: "Location",
    function: "country",
    description: {
      "zh-CN": "返回一个随机国家名称。",
      "zh-TW": "返回一個隨機國家名稱。",
      en: "Returns a random country name.",
      ja: "ランダムな国名を返します。",
      id: "Mengembalikan nama negara acak.",
    },
    params: {},
  },
  {
    module: "Location",
    function: "countryCode",
    description: {
      "zh-CN": "返回一个随机ISO_3166-1国家代码。",
      "zh-TW": "返回一個隨機ISO_3166-1國家代碼。",
      en: "Returns a random ISO_3166-1 country code.",
      ja: "ランダムなISO_3166-1国コードを返します。",
      id: "Mengembalikan kode negara ISO_3166-1 acak.",
    },
    params: {
      variant: {
        isrealKey: false,
        type: "enum(alpha-2 | alpha-3 | numeric)",
        default: "alpha-2",
        description: {
          "zh-CN":
            "要返回的代码。可以是'alpha-2'（双字母代码）、'alpha-3'（三字母代码）或'numeric'（数字代码）。",
          "zh-TW":
            "要返回的代碼。可以是'alpha-2'（雙字母代碼）、'alpha-3'（三字母代碼）或'numeric'（數字代碼）。",
          en: "The code to return. Can be either 'alpha-2' (two-letter code), 'alpha-3' (three-letter code) or 'numeric' (numeric code).",
          ja: "返されるコード。'alpha-2'（2文字コード）、'alpha-3'（3文字コード）、または'numeric'（数値コード）のいずれかになります。",
          id: "Kode yang akan dikembalikan. Dapat berupa 'alpha-2' (kode dua huruf), 'alpha-3' (kode tiga huruf), atau 'numeric' (kode numerik).",
        },
      },
    },
  },
  {
    module: "Location",
    function: "county",
    description: {
      "zh-CN": "返回一个随机本地县，或该地区国家的其他等效第二级行政实体。",
      "zh-TW": "返回一個隨機本地縣，或該地區國家的其他等效第二級行政實體。",
      en: "Returns a random localized county, or other equivalent second-level administrative entity for the locale's country.",
      ja: "ランダムなローカライズされた郡、またはその地域の国の他の同等の第二レベルの行政体を返します。",
      id: "Mengembalikan kabupaten lokal acak, atau entitas administratif tingkat kedua yang setara untuk negara wilayah tersebut.",
    },
    params: {},
  },
  {
    module: "Location",
    function: "direction",
    description: {
      "zh-CN": "返回一个随机方向（基本和序数；西北、东等）。",
      "zh-TW": "返回一個隨機方向（基礎和序數；西北、東等）。",
      en: "Returns a random direction (cardinal and ordinal; northwest, east, etc).",
      ja: "ランダムな方向（基準と序数；北西、東など）を返します。",
      id: "Mengembalikan arah acak (kardinal dan ordinal; barat laut, timur, dll).",
    },
    params: {
      abbreviated: {
        isrealKey: true,
        type: "boolean",
        default: "false",
        description: {
          "zh-CN": "如果为true，则返回缩略方向（NW、E等）。否则返回完整名称。",
          "zh-TW": "如果為true，則返回縮寫方向（NW、E等）。否則返回完整名稱。",
          en: "If true this will return abbreviated directions (NW, E, etc). Otherwise this will return the long name.",
          ja: "trueの場合は省略形の方向（NW、Eなど）を返し、そうでない場合は長い名前を返します。",
          id: "Jika true, ini akan mengembalikan arah ringkas (NW, E, dll). Jika tidak, ini akan mengembalikan nama lengkap.",
        },
      },
    },
  },
  {
    module: "Location",
    function: "latitude",
    description: {
      "zh-CN": "生成一个随机纬度。",
      "zh-TW": "生成一個隨機緯度。",
      en: "Generates a random latitude.",
      ja: "ランダムな緯度を生成します。",
      id: "Menghasilkan lintang acak.",
    },
    params: {
      max: {
        isrealKey: true,
        type: "number",
        default: 90,
        min: -90,
        max: 90,
        description: {
          "zh-CN": "要生成的纬度的上限。",
          "zh-TW": "要生成的緯度的上限。",
          en: "The upper bound for the latitude to generate.",
          ja: "生成する緯度の上限。",
          id: "Batas atas untuk lintang yang akan dihasilkan.",
        },
      },
      min: {
        isrealKey: true,
        type: "number",
        default: -90,
        min: -90,
        max: 90,
        description: {
          "zh-CN": "要生成的纬度的下限。",
          "zh-TW": "要生成的緯度的下限。",
          en: "The lower bound for the latitude to generate.",
          ja: "生成する緯度の下限。",
          id: "Batas bawah untuk lintang yang akan dihasilkan.",
        },
      },
      precision: {
        isrealKey: true,
        type: "number",
        default: 4,
        description: {
          "zh-CN": "纬度的精度小数点位数。",
          "zh-TW": "緯度的小數點精度。",
          en: "The number of decimal points of precision for the latitude.",
          ja: "緯度の小数点精度。",
          id: "Jumlah angka desimal presisi untuk lintang.",
        },
      },
    },
  },
  {
    module: "Location",
    function: "longitude",
    description: {
      "zh-CN": "生成一个随机经度。",
      "zh-TW": "生成一個隨機經度。",
      en: "Generates a random longitude.",
      ja: "ランダムな経度を生成します。",
      id: "Menghasilkan bujur acak.",
    },
    params: {
      max: {
        isrealKey: true,
        type: "number",
        default: 180,
        min: -180,
        max: 180,
        description: {
          "zh-CN": "要生成的经度的上限。",
          "zh-TW": "要生成的經度的上限。",
          en: "The upper bound for the longitude to generate.",
          ja: "生成する経度の上限。",
          id: "Batas atas untuk bujur yang akan dihasilkan.",
        },
      },
      min: {
        isrealKey: true,
        type: "number",
        default: -180,
        min: -180,
        max: 180,
        description: {
          "zh-CN": "要生成的经度的下限。",
          "zh-TW": "要生成的經度的下限。",
          en: "The lower bound for the longitude to generate.",
          ja: "生成する経度の下限。",
          id: "Batas bawah untuk bujur yang akan dihasilkan.",
        },
      },
      precision: {
        isrealKey: true,
        type: "number",
        default: 4,
        description: {
          "zh-CN": "经度的精度小数点位数。",
          "zh-TW": "經度的小數點精度。",
          en: "The number of decimal points of precision for the longitude.",
          ja: "経度の小数点精度。",
          id: "Jumlah angka desimal presisi untuk bujur.",
        },
      },
    },
  },
  {
    module: "Location",
    function: "ordinalDirection",
    description: {
      "zh-CN": "返回一个随机的序数方向（西北、东南等）。",
      "zh-TW": "返回一個隨機的序數方向（西北、東南等）。",
      en: "Returns a random ordinal direction (northwest, southeast, etc).",
      ja: "ランダムな序数方向を返します（北西、南東など）。",
      id: "Mengembalikan arah ordinal acak (barat laut, selatan timur, dll).",
    },
    params: {
      abbreviated: {
        isrealKey: true,
        type: "boolean",
        default: "false",
        description: {
          "zh-CN": "如果为true，则返回缩略方向（NW、SE等）。否则返回完整名称。",
          "zh-TW": "如果為true，則返回縮寫方向（NW、SE等）。否則返回完整名稱。",
          en: "If true this will return abbreviated directions (NW, SE, etc). Otherwise this will return the long name.",
          ja: "trueの場合は省略形の方向（NW、SEなど）を返し、そうでない場合は長い名前を返します。",
          id: "Jika true, ini akan mengembalikan arah ringkas (NW, SE, dll). Jika tidak, ini akan mengembalikan nama lengkap.",
        },
      },
    },
  },
  {
    module: "Location",
    function: "secondaryAddress",
    description: {
      "zh-CN": "生成一个随机的本地二级地址。",
      "zh-TW": "生成一個隨機的本地二級地址。",
      en: "Generates a random localized secondary address.",
      ja: "ランダムなローカライズされた二次住所を生成します。",
      id: "Menghasilkan alamat sekunder lokal acak.",
    },
    params: {},
  },
  {
    module: "Location",
    function: "state",
    description: {
      "zh-CN":
        "返回一个随机本地州，或该地区国家的其他等效第一层行政实体，如省或地区。",
      "zh-TW":
        "返回一個隨機本地州，或該地區國家的其他等效第一層行政實體，如省或地區。",
      en: "Returns a random localized state, or other equivalent first-level administrative entity for the locale's country such as a province or region.",
      ja: "ランダムなローカライズされた州、またはその地域の国の他の等価の第一レベルの行政体（省や地域など）を返します。",
      id: "Mengembalikan negara lokal acak, atau entitas administratif tingkat pertama lain yang setara untuk negara wilayah tersebut, seperti provinsi atau wilayah.",
    },
    params: {
      abbreviated: {
        isrealKey: true,
        type: "boolean",
        default: "false",
        description: {
          "zh-CN":
            "如果为true，则返回缩略的第一层行政实体名称。否则返回完整名称。",
          "zh-TW":
            "如果為true，則返回縮寫的第一層行政實體名稱。否則返回完整名稱。",
          en: "If true this will return abbreviated first-level administrative entity names. Otherwise this will return the long name.",
          ja: "trueの場合は省略された第一レベルの行政体名を返し、そうでない場合は長い名前を返します。",
          id: "Jika true, ini akan mengembalikan nama entitas administratif tingkat pertama yang disingkat. Jika tidak, ini akan mengembalikan nama panjang.",
        },
      },
    },
  },
  {
    module: "Location",
    function: "street",
    description: {
      "zh-CN": "生成一个随机本地街道名称。",
      "zh-TW": "生成一個隨機本地街道名稱。",
      en: "Generates a random localized street name.",
      ja: "ランダムなローカライズされたストリート名を生成します。",
      id: "Menghasilkan nama jalan lokal acak.",
    },
    params: {},
  },
  {
    module: "Location",
    function: "streetAddress",
    description: {
      "zh-CN": "生成一个随机的本地街道地址。",
      "zh-TW": "生成一個隨機的本地街道地址。",
      en: "Generates a random localized street address.",
      ja: "ランダムなローカライズされたストリートアドレスを生成します。",
      id: "Menghasilkan alamat jalan lokal acak.",
    },
    params: {
      useFullAddress: {
        isrealKey: true,
        type: "boolean",
        default: "",
        description: {
          "zh-CN": "如果为true，则将生成完整地址。否则仅生成街道地址。",
          "zh-TW": "如果為true，則將生成完整地址。否則僅生成街道地址。",
          en: "When true this will generate a full address. Otherwise it will just generate a street address.",
          ja: "trueの場合、完全な住所を生成し、そうでない場合はストリートアドレスを生成します。",
          id: "Ketika true, ini akan menghasilkan alamat lengkap. Jika tidak, ini hanya akan menghasilkan alamat jalan.",
        },
      },
    },
  },
  {
    module: "Location",
    function: "timeZone",
    description: {
      "zh-CN": "返回一个随机时区。",
      "zh-TW": "返回一個隨機時區。",
      en: "Returns a random time zone.",
      ja: "ランダムなタイムゾーンを返します。",
      id: "Mengembalikan zona waktu acak.",
    },
    params: {},
  },
  {
    module: "Location",
    function: "zipCode",
    description: {
      "zh-CN": "根据指定格式生成随机邮政编码。",
      "zh-TW": "根據指定格式生成隨機郵遞區號。",
      en: "Generates random zip code from specified format.",
      ja: "指定された形式からランダムな郵便番号を生成します。",
      id: "Menghasilkan kode pos acak dari format yang ditentukan.",
    },
    params: {
      format: {
        isrealKey: true,
        type: "string",
        default: "faker.definitions.location.postcode",
        description: {
          "zh-CN":
            "用于生成邮政编码的可选格式。如果指定了state选项，则此选项不会被使用。",
          "zh-TW":
            "用於生成郵遞區號的可選格式。如果指定了state選項，則此選項不會被使用。",
          en: "The optional format used to generate the zip code. This won't be used if the state option is specified.",
          ja: "郵便番号を生成するために使用されるオプションの形式。stateオプションが指定されている場合、これは使用されません。",
          id: "Format opsional yang digunakan untuk menghasilkan kode pos. Ini tidak akan digunakan jika opsi state ditentukan.",
        },
      },
      state: {
        isrealKey: true,
        type: "string",
        default: "",
        description: {
          "zh-CN":
            "为其生成邮政编码的州。如果当前区域没有对应的postcode_by_state定义，则会抛出错误。",
          "zh-TW":
            "為其生成郵遞區號的州。如果當前地區沒有對應的postcode_by_state定義，則會拋出錯誤。",
          en: "The state to generate the zip code for. If the current locale does not have a corresponding postcode_by_state definition, an error is thrown.",
          ja: "郵便番号を生成するための州。現在のロケールに対応するpostcode_by_stateの定義がない場合はエラーが発生します。",
          id: "Negara bagian untuk menghasilkan kode pos. Jika lokal saat ini tidak memiliki definisi postcode_by_state yang sesuai, kesalahan akan terjadi.",
        },
      },
    },
  },
  {
    module: "Lorem",
    function: "lines",
    description: {
      "zh-CN": "生成给定数量的以'\n'分隔的lorem行。",
      "zh-TW": "生成給定數量的以'\n'分隔的lorem行。",
      en: "Generates the given number lines of lorem separated by '\n'.",
      ja: "'\\n'で区切られた指定された数のlorem行を生成します。",
      id: "Menghasilkan jumlah baris lorem yang diberikan yang dipisahkan oleh '\\n'.",
    },
    params: {
      lineCount: {
        isrealKey: false,
        type: "number",
        default: "{ min: 1, max: 5 }",
        description: {
          "zh-CN":
            "要生成的行数。默认为1到5之间的随机数。选项包括最大行数（类型：数字）和最小行数（类型：数字）。",
          "zh-TW":
            "要生成的行數。預設為1到5之間的隨機數。選項包括最大行數（型別：數字）和最小行數（型別：數字）。",
          en: "The number of lines to generate. Defaults to a random number between 1 and 5. Options include max (type: number) which is the maximum number of lines to generate. And min (type: number) which is the minimum number of lines to generate.",
          ja: "生成する行数。デフォルトは1から5の間のランダムな数です。オプションには最大（タイプ：数値）の行数を生成するための最大数が含まれます。最小（タイプ：数値）を生成するための最小行数も含まれます。",
          id: "Jumlah baris yang akan dihasilkan. Secara default adalah angka acak antara 1 dan 5. Opsi mencakup max (tipe: nomor) yang merupakan jumlah maksimum baris yang akan dihasilkan. Dan min (tipe: nomor) yang merupakan jumlah minimum baris yang akan dihasilkan.",
        },
      },
      max: {
        isrealKey: true,
        type: "number",
        default: "",
        description: {
          "zh-CN": "要生成的最大行数。",
          "zh-TW": "要生成的最大行數。",
          en: "The maximum number of lines to generate.",
          ja: "生成する最大行数。",
          id: "Jumlah maksimum baris yang akan dihasilkan.",
        },
      },
      min: {
        isrealKey: true,
        type: "number",
        default: "",
        description: {
          "zh-CN": "要生成的最小行数。",
          "zh-TW": "要生成的最小行數。",
          en: "The minimum number of lines to generate.",
          ja: "生成する最小行数。",
          id: "Jumlah minimum baris yang akan dihasilkan.",
        },
      },
    },
  },
  {
    module: "Lorem",
    function: "paragraph",
    description: {
      "zh-CN": "根据给定句子的数量生成一个段落。",
      "zh-TW": "根據給定句子的數量生成一段。",
      en: "Generates a paragraph with the given number of sentences.",
      ja: "指定された数の文を含む段落を生成します。",
      id: "Menghasilkan paragraf dengan jumlah kalimat yang diberikan.",
    },
    params: {
      sentenceCount: {
        isrealKey: false,
        type: "number",
        default: 3,
        description: {
          "zh-CN":
            "要生成的句子数量。选项包含最大句子数（类型：数字）和最小句子数（类型：数字）。",
          "zh-TW":
            "要生成的句子數量。選項包括最大句子數（型別：數字）和最小句子數（型別：數字）。",
          en: "The number of sentences to generate. Options include max (type: number) which is the maximum number of sentences to generate. And min (type: number) which is the minimum number of sentences to generate.",
          ja: "生成する文の数。オプションには、生成する文の最大数を含むmax（タイプ：数値）と最小数を含むmin（タイプ：数値）があります。",
          id: "Jumlah kalimat yang akan dihasilkan. Opsi mencakup max (tipe: nomor) yang merupakan jumlah maksimum kalimat yang akan dihasilkan. Dan min (tipe: nomor) yang merupakan jumlah minimum kalimat yang akan dihasilkan.",
        },
      },
      max: {
        isrealKey: true,
        type: "number",
        default: "",
        description: {
          "zh-CN": "要生成的最大句子数。",
          "zh-TW": "要生成的最大句子數。",
          en: "The maximum number of sentences to generate.",
          ja: "生成する最大文の数。",
          id: "Jumlah maksimum kalimat yang akan dihasilkan.",
        },
      },
      min: {
        isrealKey: true,
        type: "number",
        default: "",
        description: {
          "zh-CN": "要生成的最小句子数。",
          "zh-TW": "要生成的最小句子數。",
          en: "The minimum number of sentences to generate.",
          ja: "生成する最小文の数。",
          id: "Jumlah minimum kalimat yang akan dihasilkan.",
        },
      },
    },
  },
  {
    module: "Lorem",
    function: "paragraphs",
    description: {
      "zh-CN": "生成给定数量的段落。",
      "zh-TW": "生成給定數量的段落。",
      en: "Generates the given number of paragraphs.",
      ja: "指定された数の段落を生成します。",
      id: "Menghasilkan jumlah paragraf yang diberikan.",
    },
    params: {
      paragraphCount: {
        isrealKey: false,
        type: "number",
        default: 3,
        description: {
          "zh-CN":
            "要生成的段落数量。选项包含最大段落数（类型：数字）和最小段落数（类型：数字）。",
          "zh-TW":
            "要生成的段落數量。選項包括最大段落數（型別：數字）和最小段落數（型別：數字）。",
          en: "The number of paragraphs to generate. Options include max (type: number) which is the maximum number of paragraphs to generate. And min (type: number) which is the minimum number of paragraphs to generate.",
          ja: "生成する段落の数。オプションには、生成する段落の最大数を含むmax（タイプ：数値）と最小数を含むmin（タイプ：数値）があります。",
          id: "Jumlah paragraf yang akan dihasilkan. Opsi mencakup max (tipe: nomor) yang merupakan jumlah maksimum paragraf yang akan dihasilkan. Dan min (tipe: nomor) yang merupakan jumlah minimum paragraf yang akan dihasilkan.",
        },
      },
      max: {
        isrealKey: true,
        type: "number",
        default: "",
        description: {
          "zh-CN": "要生成的最大段落数。",
          "zh-TW": "要生成的最大段落數。",
          en: "The maximum number of paragraphs to generate.",
          ja: "生成する最大段落の数。",
          id: "Jumlah maksimum paragraf yang akan dihasilkan.",
        },
      },
      min: {
        isrealKey: true,
        type: "number",
        default: "",
        description: {
          "zh-CN": "要生成的最小段落数。",
          "zh-TW": "要生成的最小段落數。",
          en: "The minimum number of paragraphs to generate.",
          ja: "生成する最小段落の数。",
          id: "Jumlah minimum paragraf yang akan dihasilkan.",
        },
      },
      separator: {
        isrealKey: false,
        type: "string",
        default: "'\\n'",
        description: {
          "zh-CN": "要使用的分隔符。",
          "zh-TW": "要使用的分隔符。",
          en: "The separator to use.",
          ja: "使用する区切り。",
          id: "Pemisah yang akan digunakan.",
        },
      },
    },
  },
  {
    module: "Lorem",
    function: "sentence",
    description: {
      "zh-CN": "生成一个以空格分隔的单词列表，首字母大写且以句号结尾。",
      "zh-TW": "生成一個以空格分隔的單詞列表，首字母大寫且以句號結尾。",
      en: "Generates a space separated list of words beginning with a capital letter and ending with a period.",
      ja: "最初の文字が大文字で、最後がピリオドで終わる単語のスペース区切りリストを生成します。",
      id: "Menghasilkan daftar kata yang dipisahkan oleh spasi, dimulai dengan huruf kapital dan diakhiri dengan titik.",
    },
    params: {
      wordCount: {
        isrealKey: false,
        type: "number",
        default: "{ min: 3, max: 10 }",
        description: {
          "zh-CN":
            "句子中应包含的单词数量。默认为3到10之间的随机数。选项包含最大单词数（类型：数字）和最小单词数（类型：数字）。",
          "zh-TW":
            "句子中應包含的單詞數量。預設為3到10之間的隨機數。選項包括最大單詞數（型別：數字）和最小單詞數（型別：數字）。",
          en: "The number of words, that should be in the sentence. Defaults to a random number between 3 and 10. Options include max (type: number) which is the maximum number of words to generate. And min (type: number) which is the minimum number of words to generate.",
          ja: "文に含まれるべき単語数。デフォルトは3から10の間のランダムな数です。オプションには最大（タイプ：数値）の単語数と最小（タイプ：数値）の単語数が含まれます。",
          id: "Jumlah kata yang harus ada dalam kalimat. Secara default adalah angka acak antara 3 dan 10. Opsi mencakup max (tipe: nomor) yang merupakan jumlah maksimum kata yang akan dihasilkan. Dan min (tipe: nomor) yang merupakan jumlah minimum kata yang akan dihasilkan.",
        },
      },
      max: {
        isrealKey: true,
        type: "number",
        default: "",
        description: {
          "zh-CN": "要生成的最大单词数。",
          "zh-TW": "要生成的最大單詞數。",
          en: "The maximum number of words to generate.",
          ja: "生成する最大単語の数。",
          id: "Jumlah maksimum kata yang akan dihasilkan.",
        },
      },
      min: {
        isrealKey: true,
        type: "number",
        default: "",
        description: {
          "zh-CN": "要生成的最小单词数。",
          "zh-TW": "要生成的最小單詞數。",
          en: "The minimum number of words to generate.",
          ja: "生成する最小単語の数。",
          id: "Jumlah minimum kata yang akan dihasilkan.",
        },
      },
    },
  },
  {
    module: "Lorem",
    function: "sentences",
    description: {
      "zh-CN": "生成指定数量的句子。",
      "zh-TW": "生成指定數量的句子。",
      en: "Generates the given number of sentences.",
      ja: "指定された数の文を生成します。",
      id: "Menghasilkan jumlah kalimat yang diberikan.",
    },
    params: {
      sentenceCount: {
        isrealKey: false,
        type: "number",
        default: "{ min: 2, max: 6 }",
        description: {
          "zh-CN":
            "要生成的句子数量。默认为2到6之间的随机数。选项包含最大句子数（类型：数字）和最小句子数（类型：数字）。",
          "zh-TW":
            "要生成的句子數量。預設為2到6之間的隨機數。選項包括最大句子數（型別：數字）和最小句子數（型別：數字）。",
          en: "The number of sentences to generate. Defaults to a random number between 2 and 6. Options include max (type: number) which is the maximum number of sentences to generate. And min (type: number) which is the minimum number of sentences to generate.",
          ja: "生成する文の数。デフォルトは2から6の間のランダムな数です。オプションには、最大（タイプ：数値）の文の数と最小（タイプ：数値）が含まれます。",
          id: "Jumlah kalimat yang akan dihasilkan. Secara default adalah angka acak antara 2 dan 6. Opsi mencakup max (tipe: nomor) yang merupakan jumlah maksimum kalimat yang akan dihasilkan. Dan min (tipe: nomor) yang merupakan jumlah minimum kalimat yang akan dihasilkan.",
        },
      },
      max: {
        isrealKey: true,
        type: "number",
        default: "",
        description: {
          "zh-CN": "要生成的最大句子数。",
          "zh-TW": "要生成的最大句子數。",
          en: "The maximum number of sentences to generate.",
          ja: "生成する最大文の数。",
          id: "Jumlah maksimum kalimat yang akan dihasilkan.",
        },
      },
      min: {
        isrealKey: true,
        type: "number",
        default: "",
        description: {
          "zh-CN": "要生成的最小句子数。",
          "zh-TW": "要生成的最小句子數。",
          en: "The minimum number of sentences to generate.",
          ja: "生成する最小文の数。",
          id: "Jumlah minimum kalimat yang akan dihasilkan.",
        },
      },
      separator: {
        isrealKey: false,
        type: "string",
        default: "' '",
        description: {
          "zh-CN": "在句子之间添加的分隔符。",
          "zh-TW": "在句子之間添加的分隔符。",
          en: "The separator to add between sentences.",
          ja: "文の間に追加する区切り。",
          id: "Pemisah yang akan ditambahkan di antara kalimat.",
        },
      },
    },
  },
  {
    module: "Lorem",
    function: "slug",
    description: {
      "zh-CN": "生成由给定数量的用连字符分隔的单词组成的slug文本。",
      "zh-TW": "生成由給定數量的用連字符分隔的單詞組成的slug文本。",
      en: "Generates a slugified text consisting of the given number of hyphen separated words.",
      ja: "ハイフンで区切られた指定された数の単語で構成されるスラッグ化されたテキストを生成します。",
      id: "Menghasilkan teks slug yang terdiri dari sejumlah kata yang dipisahkan oleh tanda hubung.",
    },
    params: {
      wordCount: {
        isrealKey: false,
        type: "number",
        default: 3,
        description: {
          "zh-CN":
            "要生成的单词数量。选项包括最大单词数（类型：数字）和最小单词数（类型：数字）。",
          "zh-TW":
            "要生成的單詞數量。選項包括最大單詞數（型別：數字）和最小單詞數（型別：數字）。",
          en: "The number of words to generate. Options include max (type: number) which is the maximum number of words to generate. And min (type: number) which is the minimum number of words to generate.",
          ja: "生成する単語数。オプションには、生成する最大（タイプ：数値）単語数と最小（タイプ：数値）が含まれます。",
          id: "Jumlah kata yang akan dihasilkan. Opsi mencakup max (tipe: nomor) yang merupakan jumlah maksimum kata yang akan dihasilkan. Dan min (tipe: nomor) yang merupakan jumlah minimum kata yang akan dihasilkan.",
        },
      },
      max: {
        isrealKey: true,
        type: "number",
        default: "",
        description: {
          "zh-CN": "要生成的最大单词数。",
          "zh-TW": "要生成的最大單詞數。",
          en: "The maximum number of words to generate.",
          ja: "生成する最大単語の数。",
          id: "Jumlah maksimum kata yang akan dihasilkan.",
        },
      },
      min: {
        isrealKey: true,
        type: "number",
        default: "",
        description: {
          "zh-CN": "要生成的最小单词数。",
          "zh-TW": "要生成的最小單詞數。",
          en: "The minimum number of words to generate.",
          ja: "生成する最小単語の数。",
          id: "Jumlah minimum kata yang akan dihasilkan.",
        },
      },
    },
  },
  {
    module: "Lorem",
    function: "text",
    description: {
      "zh-CN": "根据随机lorem方法生成随机文本。",
      "zh-TW": "根據隨機lorem方法生成隨機文本。",
      en: "Generates a random text based on a random lorem method.",
      ja: "ランダムなloremメソッドに基づいてランダムなテキストを生成します。",
      id: "Menghasilkan teks acak berdasarkan metode lorem acak.",
    },
    params: {},
  },
  {
    module: "Lorem",
    function: "word",
    description: {
      "zh-CN": "生成指定长度的单词。",
      "zh-TW": "生成指定長度的單詞。",
      en: "Generates a word of a specified length.",
      ja: "指定された長さの単語を生成します。",
      id: "Menghasilkan kata dengan panjang yang ditentukan.",
    },
    params: {
      length: {
        isrealKey: true,
        type: "number",
        default: 1,
        description: {
          "zh-CN": "单词的预期长度。",
          "zh-TW": "單詞的預期長度。",
          en: "The expected length of the word.",
          ja: "単語の期待される長さ。",
          id: "Panjang yang diharapkan dari kata tersebut.",
        },
      },
      "length.min": {
        isrealKey: true,
        type: "number",
        default: 1,
        description: {
          "zh-CN": "单词的最低预期长度。",
          "zh-TW": "單詞的最低預期長度。",
          en: "The expected min length of the word.",
          ja: "単語の期待される最小長さ。",
          id: "Panjang minimum yang diharapkan dari kata tersebut.",
        },
      },
      "length.max": {
        isrealKey: true,
        type: "number",
        default: 5,
        description: {
          "zh-CN": "单词的最大预期长度。",
          "zh-TW": "單詞的最大預期長度。",
          en: "The expected max length of the word.",
          ja: "単語の期待される最大長さ。",
          id: "Panjang maksimum yang diharapkan dari kata tersebut.",
        },
      },
      strategy: {
        isrealKey: true,
        type: "enum(fail | closest | shortest | longest | any-length)",
        default: "'any-length'",
        description: {
          "zh-CN":
            "当没有匹配长度的单词时应用的策略。可用的错误处理策略：fail：如果没有找到给定长度的单词，则抛出错误。shortest：返回任何最短的单词。closest：返回任何接近给定长度的单词。longest：返回任何最长的单词。any-length：返回任何长度的单词。",
          "zh-TW":
            "當沒有匹配長度的單詞時應用的策略。可用的錯誤處理策略：fail：如果未找到給定長度的單詞，則拋出錯誤。shortest：返回任何最短的單詞。closest：返回任何接近給定長度的單詞。longest：返回任何最長的單詞。any-length：返回任何長度的單詞。",
          en: "The strategy to apply when no words with a matching length are found. Available error handling strategies: fail: Throws an error if no words with the given length are found. shortest: Returns any of the shortest words. closest: Returns any of the words closest to the given length. longest: Returns any of the longest words. any-length: Returns a word with any length.",
          ja: "一致する長さの単語が見つからない場合に適用する戦略。利用可能なエラーハンドリング戦略：fail：指定された長さの単語が見つからない場合はエラーをスローします。shortest：最短の単語を返します。closest：与えられた長さに最も近い単語を返します。longest：最も長い単語を返します。any-length：任意の長さの単語を返します。",
          id: "Strategi yang diterapkan ketika tidak ada kata dengan panjang yang cocok ditemukan. Strategi penanganan kesalahan yang tersedia: fail: Menghasilkan kesalahan jika tidak ada kata dengan panjang yang diberikan. shortest: Mengembalikan salah satu kata terpendek. closest: Mengembalikan kata yang paling mendekati panjang yang diberikan. longest: Mengembalikan salah satu kata terpanjang. any-length: Mengembalikan kata dengan panjang berapa pun.",
        },
      },
    },
  },
  {
    module: "Lorem",
    function: "words",
    description: {
      "zh-CN": "生成一个以空格分隔的单词列表。",
      "zh-TW": "生成一個以空格分隔的單詞列表。",
      en: "Generates a space separated list of words.",
      ja: "スペースで区切られた単語のリストを生成します。",
      id: "Menghasilkan daftar kata yang dipisahkan oleh spasi.",
    },
    params: {
      wordCount: {
        isrealKey: false,
        type: "number",
        default: 3,
        description: {
          "zh-CN":
            "要生成的单词数量。选项包括最大单词数（类型：数字）和最小单词数（类型：数字）。",
          "zh-TW":
            "要生成的單詞數量。選項包括最大單詞數（型別：數字）和最小單詞數（型別：數字）。",
          en: "The number of words to generate. Options include max (type: number) which is the maximum number of words to generate. And min (type: number) which is the minimum number of words to generate.",
          ja: "生成する単語数。オプションには、生成する最大（タイプ：数値）の単語数と最小（タイプ：数値）が含まれます。",
          id: "Jumlah kata yang akan dihasilkan. Opsi mencakup max (tipe: nomor) yang merupakan jumlah maksimum kata yang akan dihasilkan. Dan min (tipe: nomor) yang merupakan jumlah minimum kata yang akan dihasilkan.",
        },
      },
      max: {
        isrealKey: true,
        type: "number",
        default: "",
        description: {
          "zh-CN": "要生成的最大单词数。",
          "zh-TW": "要生成的最大單詞數。",
          en: "The maximum number of words to generate.",
          ja: "生成する最大単語の数。",
          id: "Jumlah maksimum kata yang akan dihasilkan.",
        },
      },
      min: {
        isrealKey: true,
        type: "number",
        default: "",
        description: {
          "zh-CN": "要生成的最小单词数。",
          "zh-TW": "要生成的最小單詞數。",
          en: "The minimum number of words to generate.",
          ja: "生成する最小単語の数。",
          id: "Jumlah minimum kata yang akan dihasilkan.",
        },
      },
    },
  },
  {
    module: "Music",
    function: "album",
    description: {
      "zh-CN": "返回一个随机专辑名称。",
      "zh-TW": "返回一個隨機專輯名稱。",
      en: "Returns a random album name.",
      ja: "ランダムなアルバム名を返します。",
      id: "Mengembalikan nama album acak.",
    },
    params: {},
  },
  {
    module: "Music",
    function: "artist",
    description: {
      "zh-CN": "返回一个随机艺术家名称。",
      "zh-TW": "返回一個隨機藝術家名稱。",
      en: "Returns a random artist name.",
      ja: "ランダムなアーティスト名を返します。",
      id: "Mengembalikan nama artis acak.",
    },
    params: {},
  },
  {
    module: "Music",
    function: "genre",
    description: {
      "zh-CN": "返回一个随机音乐类型。",
      "zh-TW": "返回一個隨機音樂類型。",
      en: "Returns a random music genre.",
      ja: "ランダムな音楽ジャンルを返します。",
      id: "Mengembalikan genre musik acak.",
    },
    params: {},
  },
  {
    module: "Music",
    function: "songName",
    description: {
      "zh-CN": "返回一个随机歌曲名称。",
      "zh-TW": "返回一個隨機歌曲名稱。",
      en: "Returns a random song name.",
      ja: "ランダムな曲名を返します。",
      id: "Mengembalikan nama lagu acak.",
    },
    params: {},
  },
  {
    module: "Number",
    function: "bigInt",
    description: {
      "zh-CN": "返回一个BigInt数字。范围是包含的。",
      "zh-TW": "返回一個BigInt數字。範圍是包含的。",
      en: "Returns a BigInt number. The bounds are inclusive.",
      ja: "BigInt数を返します。範囲は含まれています。",
      id: "Mengembalikan angka BigInt. Batasannya inklusif.",
    },
    params: {
      max: {
        isrealKey: true,
        type: "bigint",
        default: "min + 999999999999999n",
        description: {
          "zh-CN": "生成的bigint的上限。",
          "zh-TW": "生成的bigint的上限。",
          en: "Upper bound for generated bigint.",
          ja: "生成されるbigintの上限。",
          id: "Batas atas untuk bigint yang dihasilkan.",
        },
      },
      min: {
        isrealKey: true,
        type: "bigint",
        default: "0n",
        description: {
          "zh-CN": "生成的bigint的下限。",
          "zh-TW": "生成的bigint的下限。",
          en: "Lower bound for generated bigint.",
          ja: "生成されるbigintの下限。",
          id: "Batas bawah untuk bigint yang dihasilkan.",
        },
      },
    },
  },
  {
    module: "Number",
    function: "binary",
    description: {
      "zh-CN": "返回一个二进制数字。范围是包含的。",
      "zh-TW": "返回一個二進位數字。範圍是包含的。",
      en: "Returns a binary number. The bounds are inclusive.",
      ja: "バイナリ数を返します。範囲は含まれています。",
      id: "Mengembalikan angka biner. Batasnya inklusif.",
    },
    params: {
      max: {
        isrealKey: true,
        type: "number",
        default: 1,
        description: {
          "zh-CN": "生成的数字的上限。",
          "zh-TW": "生成的數字的上限。",
          en: "Upper bound for generated number.",
          ja: "生成される数の上限。",
          id: "Batas atas untuk angka yang dihasilkan.",
        },
      },
      min: {
        isrealKey: true,
        type: "number",
        default: 0,
        description: {
          "zh-CN": "生成的数字的下限。",
          "zh-TW": "生成的數字的下限。",
          en: "Lower bound for generated number.",
          ja: "生成される数の下限。",
          id: "Batas bawah untuk angka yang dihasilkan.",
        },
      },
    },
  },
  {
    module: "Number",
    function: "float",
    description: {
      "zh-CN": "返回一个随机浮点数。",
      "zh-TW": "返回一個隨機浮點數。",
      en: "Returns a single random floating-point number.",
      ja: "ランダムな浮動小数点数を返します。",
      id: "Menghasilkan satu angka desimal acak.",
    },
    params: {
      fractionDigits: {
        isrealKey: true,
        type: "number",
        default: "",
        description: {
          "zh-CN":
            "小数点后出现的最大位数。例如，2将四舍五入到2位小数。只应传递multipleOf或fractionDigits中的一个。",
          "zh-TW":
            "小數點後出現的最大位數。例如，2將四捨五入到2位小數。只應傳遞multipleOf或fractionDigits中的一個。",
          en: "The maximum number of digits to appear after the decimal point. For example, 2 will round to 2 decimal points. Only one of multipleOf or fractionDigits should be passed.",
          ja: "小数点以下の最大桁数。たとえば、2は小数点以下2桁に丸められます。multipleOfまたはfractionDigitsのいずれか1つのみを渡す必要があります。",
          id: "Jumlah maksimum digit yang akan muncul setelah titik desimal. Misalnya, 2 akan dibulatkan menjadi 2 tempat desimal. Hanya satu dari multipleOf atau fractionDigits yang harus diteruskan.",
        },
      },
      max: {
        isrealKey: true,
        type: "number",
        default: 1.0,
        precision: 1,
        description: {
          "zh-CN":
            "生成数字的上限，不包括multipleOf或fractionDigits传递的上限。",
          "zh-TW":
            "生成數字的上限，不包括multipleOf或fractionDigits傳遞的上限。",
          en: "Upper bound for generated number, exclusive, unless multipleOf or fractionDigits are passed.",
          ja: "生成される数の上限、exclusive、multipleOfやfractionDigitsが渡されない限り。",
          id: "Batas atas untuk angka yang dihasilkan, eksklusif, kecuali jika multipleOf atau fractionDigits diteruskan.",
        },
      },
      min: {
        isrealKey: true,
        type: "number",
        default: 0.0,
        precision: 1,
        description: {
          "zh-CN": "生成数字的下限，包括。",
          "zh-TW": "生成數字的下限，包括。",
          en: "Lower bound for generated number, inclusive.",
          ja: "生成される数の下限、inclusive。",
          id: "Batas bawah untuk angka yang dihasilkan, inklusif.",
        },
      },
      multipleOf: {
        isrealKey: true,
        type: "number",
        default: "",
        precision: 5,
        description: {
          "zh-CN":
            "生成的数字将是此参数的倍数。multipleOf或fractionDigits中只应传递一个。",
          "zh-TW":
            "生成的數字將是此參數的倍數。multipleOf或fractionDigits中只應傳遞一個。",
          en: "The generated number will be a multiple of this parameter. Only one of multipleOf or fractionDigits should be passed.",
          ja: "生成される数はこのパラメータの倍数になります。multipleOfまたはfractionDigitsの1つのみを渡す必要があります。",
          id: "Angka yang dihasilkan akan menjadi kelipatan dari parameter ini. Hanya satu dari multipleOf atau fractionDigits yang harus diteruskan.",
        },
      },
    },
  },
  {
    module: "Number",
    function: "hex",
    description: {
      "zh-CN": "返回一个小写的十六进制数字。",
      "zh-TW": "返回一個小寫的十六進位數字。",
      en: "Returns a lowercase hexadecimal number.",
      ja: "小文字の16進数を返します。",
      id: "Mengembalikan angka heksadesimal kecil.",
    },
    params: {
      max: {
        isrealKey: true,
        type: "number",
        default: 15,
        description: {
          "zh-CN": "生成数字的上限。",
          "zh-TW": "生成數字的上限。",
          en: "Upper bound for generated number.",
          ja: "生成される数の上限。",
          id: "Batas atas untuk angka yang dihasilkan.",
        },
      },
      min: {
        isrealKey: true,
        type: "number",
        default: 0,
        description: {
          "zh-CN": "生成数字的下限。",
          "zh-TW": "生成數字的下限。",
          en: "Lower bound for generated number.",
          ja: "生成される数の下限。",
          id: "Batas bawah untuk angka yang dihasilkan.",
        },
      },
    },
  },
  {
    module: "Number",
    function: "int",
    description: {
      "zh-CN": "返回一个介于零和给定最大值或范围之间的随机整数。",
      "zh-TW": "返回一個介於零和給定最大值或範圍之間的隨機整數。",
      en: "Returns a single random integer between zero and the given max value or the given range.",
      ja: "ゼロと指定された最大値または指定された範囲の間にあるランダムな整数を返します。",
      id: "Mengembalikan bilangan bulat acak tunggal antara nol dan nilai maksimum yang diberikan atau rentang yang diberikan.",
    },
    params: {
      max: {
        isrealKey: true,
        type: "number",
        default: "Number.MAX_SAFE_INTEGER",
        description: {
          "zh-CN": "生成数字的上限。",
          "zh-TW": "生成數字的上限。",
          en: "Upper bound for generated number.",
          ja: "生成される数の上限。",
          id: "Batas atas untuk angka yang dihasilkan.",
        },
      },
      min: {
        isrealKey: true,
        type: "number",
        default: 0,
        description: {
          "zh-CN": "生成数字的下限。",
          "zh-TW": "生成數字的下限。",
          en: "Lower bound for generated number.",
          ja: "生成される数の下限。",
          id: "Batas bawah untuk angka yang dihasilkan.",
        },
      },
      multipleOf: {
        isrealKey: true,
        type: "number",
        default: 1,
        description: {
          "zh-CN": "生成的数字将是给定整数的倍数。",
          "zh-TW": "生成的數字將是給定整數的倍數。",
          en: "Generated number will be a multiple of the given integer.",
          ja: "生成される数は指定された整数の倍数になります。",
          id: "Angka yang dihasilkan akan menjadi kelipatan dari bilangan bulat yang diberikan.",
        },
      },
    },
  },
  {
    module: "Number",
    function: "octal",
    description: {
      "zh-CN": "返回一个八进制数字。范围是包含的。",
      "zh-TW": "返回一個八進位數字。範圍是包含的。",
      en: "Returns an octal number. The bounds are inclusive.",
      ja: "8進数を返します。範囲は含まれています。",
      id: "Mengembalikan angka oktal. Batasnya inklusif.",
    },
    params: {
      max: {
        isrealKey: true,
        type: "number",
        default: 7,
        description: {
          "zh-CN": "生成数字的上限。",
          "zh-TW": "生成的數字的上限。",
          en: "Upper bound for generated number.",
          ja: "生成される数の上限。",
          id: "Batas atas untuk angka yang dihasilkan.",
        },
      },
      min: {
        isrealKey: true,
        type: "number",
        default: 0,
        description: {
          "zh-CN": "生成数字的下限。",
          "zh-TW": "生成的數字的下限。",
          en: "Lower bound for generated number.",
          ja: "生成される数の下限。",
          id: "Batas bawah untuk angka yang dihasilkan.",
        },
      },
    },
  },
  {
    module: "Number",
    function: "romanNumeral",
    description: {
      "zh-CN": "返回以字符串格式表示的罗马数字。",
      "zh-TW": "返回以字串格式表示的羅馬數字。",
      en: "Returns a roman numeral in String format.",
      ja: "文字列形式のローマ数字を返します。",
      id: "Mengembalikan angka Romawi dalam format String.",
    },
    params: {
      max: {
        isrealKey: true,
        type: "number",
        default: 3999,
        description: {
          "zh-CN": "生成数字的上限。",
          "zh-TW": "生成數字的上限。",
          en: "Upper bound for generated number.",
          ja: "生成される数字の上限。",
          id: "Batas atas untuk angka yang dihasilkan.",
        },
      },
      min: {
        isrealKey: true,
        type: "number",
        default: 1,
        description: {
          "zh-CN": "生成数字的下限。",
          "zh-TW": "生成數字的下限。",
          en: "Lower bound for generated number.",
          ja: "生成される数字の下限。",
          id: "Batas bawah untuk angka yang dihasilkan.",
        },
      },
    },
  },
  {
    module: "Person",
    function: "bio",
    description: {
      "zh-CN": "返回一份随机的简短传记。",
      "zh-TW": "返回一份隨機的簡短傳記。",
      en: "Returns a random short biography",
      ja: "ランダムな短い伝記を返します。",
      id: "Mengembalikan biografi pendek acak.",
    },
    params: {},
  },
  {
    module: "Person",
    function: "firstName",
    description: {
      "zh-CN": "返回一个随机的名字。",
      "zh-TW": "返回一個隨機的名字。",
      en: "Returns a random first name.",
      ja: "ランダムなファーストネームを返します。",
      id: "Mengembalikan nama depan acak.",
    },
    params: {
      sex: {
        isrealKey: true,
        type: "enum(female | male)",
        default: "",
        description: {
          "zh-CN": "要使用的可选性别。可以是“女性”或“男性”。",
          "zh-TW": "要使用的可選性別。可以是「女性」或「男性」。",
          en: "The optional sex to use. Can be either 'female' or 'male'.",
          ja: "使用するオプションの性別。「female」または「male」のいずれかです。",
          id: "Jenis kelamin opsional yang akan digunakan. Bisa 'female' atau 'male'.",
        },
      },
    },
  },
  {
    module: "Person",
    function: "fullName",
    description: {
      "zh-CN": "生成一个随机的全名。",
      "zh-TW": "生成一個隨機的全名。",
      en: "Generates a random full name.",
      ja: "ランダムなフルネームを生成します。",
      id: "Menghasilkan nama lengkap acak.",
    },
    params: {
      firstName: {
        isrealKey: true,
        type: "string",
        default: "faker.person.firstName(sex)",
        description: {
          "zh-CN": "要使用的可选名字。如果未指定，将随机选择一个。",
          "zh-TW": "要使用的可選名字。如果未指定，將隨機選擇一個。",
          en: "The optional first name to use. If not specified a random one will be chosen.",
          ja: "使用するオプションの名前（ファーストネーム）。指定されていない場合はランダムに選ばれます。",
          id: "Nama depan opsional yang akan digunakan. Jika tidak ditentukan, satu akan dipilih secara acak.",
        },
      },
      lastName: {
        isrealKey: true,
        type: "string",
        default: "faker.person.lastName(sex)",
        description: {
          "zh-CN": "要使用的可选姓氏。如果未指定，将随机选择一个。",
          "zh-TW": "要使用的可選姓氏。如果未指定，將隨機選擇一個。",
          en: "The optional last name to use. If not specified a random one will be chosen.",
          ja: "使用するオプションの姓（ラストネーム）。指定されていない場合はランダムに選ばれます。",
          id: "Nama belakang opsional yang akan digunakan. Jika tidak ditentukan, satu akan dipilih secara acak.",
        },
      },
      sex: {
        isrealKey: true,
        type: "enum(female | male)",
        default: "faker.helpers.arrayElement(['female', 'male'])",
        description: {
          "zh-CN": "要使用的可选性别。可以是“女性”或“男性”。",
          "zh-TW": "要使用的可選性別。可以是「女性」或「男性」。",
          en: "The optional sex to use. Can be either 'female' or 'male'.",
          ja: "使用するオプションの性別。「female」または「male」のいずれかです。",
          id: "Jenis kelamin opsional yang akan digunakan. Bisa 'female' atau 'male'.",
        },
      },
    },
  },
  {
    module: "Person",
    function: "gender",
    description: {
      "zh-CN": "返回一个随机性别。",
      "zh-TW": "返回一個隨機性別。",
      en: "Returns a random gender.",
      ja: "ランダムな性別を返します。",
      id: "Mengembalikan jenis kelamin acak.",
    },
    params: {},
  },
  {
    module: "Person",
    function: "jobArea",
    description: {
      "zh-CN": "生成一个随机的工作领域。",
      "zh-TW": "生成一個隨機的工作領域。",
      en: "Generates a random job area.",
      ja: "ランダムな職業分野を生成します。",
      id: "Menghasilkan bidang pekerjaan acak.",
    },
    params: {},
  },
  {
    module: "Person",
    function: "jobDescriptor",
    description: {
      "zh-CN": "生成一个随机的工作描述。",
      "zh-TW": "生成一個隨機的工作描述。",
      en: "Generates a random job descriptor.",
      ja: "ランダムな職業の説明を生成します。",
      id: "Menghasilkan deskriptor pekerjaan acak.",
    },
    params: {},
  },
  {
    module: "Person",
    function: "jobTitle",
    description: {
      "zh-CN": "生成一个随机的工作标题。",
      "zh-TW": "生成一個隨機的工作標題。",
      en: "Generates a random job title.",
      ja: "ランダムな職業タイトルを生成します。",
      id: "Menghasilkan gelar pekerjaan acak.",
    },
    params: {},
  },
  {
    module: "Person",
    function: "jobType",
    description: {
      "zh-CN": "生成一个随机的工作类型。",
      "zh-TW": "生成一個隨機的工作類型。",
      en: "Generates a random job type.",
      ja: "ランダムな職業タイプを生成します。",
      id: "Menghasilkan jenis pekerjaan acak.",
    },
    params: {},
  },
  {
    module: "Person",
    function: "lastName",
    description: {
      "zh-CN": "返回一个随机的姓氏。",
      "zh-TW": "返回一個隨機的姓氏。",
      en: "Returns a random last name.",
      ja: "ランダムな姓を返します。",
      id: "Mengembalikan nama belakang acak.",
    },
    params: {
      sex: {
        isrealKey: true,
        type: "enum(female | male)",
        default: "",
        description: {
          "zh-CN": "要使用的可选性别。可以是“女性”或“男性”。",
          "zh-TW": "要使用的可選性別。可以是「女性」或「男性」。",
          en: "The optional sex to use. Can be either 'female' or 'male'.",
          ja: "使用するオプションの性別。「female」または「male」のいずれかです。",
          id: "Jenis kelamin opsional yang akan digunakan. Bisa 'female' atau 'male'.",
        },
      },
    },
  },
  {
    module: "Person",
    function: "middleName",
    description: {
      "zh-CN": "返回一个随机的中间名。",
      "zh-TW": "返回一個隨機的中間名。",
      en: "Returns a random middle name.",
      ja: "ランダムなミドルネームを返します。",
      id: "Mengembalikan nama tengah acak.",
    },
    params: {
      sex: {
        isrealKey: true,
        type: "enum(female | male)",
        default: "",
        description: {
          "zh-CN": "要使用的可选性别。可以是“女性”或“男性”。",
          "zh-TW": "要使用的可選性別。可以是「女性」或「男性」。",
          en: "The optional sex to use. Can be either 'female' or 'male'.",
          ja: "使用するオプションの性別。「female」または「male」のいずれかです。",
          id: "Jenis kelamin opsional yang akan digunakan. Bisa 'female' atau 'male'.",
        },
      },
    },
  },
  {
    module: "Person",
    function: "prefix",
    description: {
      "zh-CN": "返回一个随机的人称前缀。",
      "zh-TW": "返回一個隨機的人稱前綴。",
      en: "Returns a random person prefix.",
      ja: "ランダムな人名プレフィックスを返します。",
      id: "Mengembalikan awalan orang acak.",
    },
    params: {
      sex: {
        isrealKey: true,
        type: "enum(female | male)",
        default: "",
        description: {
          "zh-CN": "要使用的可选性别。可以是“女性”或“男性”。",
          "zh-TW": "要使用的可選性別。可以是「女性」或「男性」。",
          en: "The optional sex to use. Can be either 'female' or 'male'.",
          ja: "使用するオプションの性別。「female」または「male」のいずれかです。",
          id: "Jenis kelamin opsional yang akan digunakan. Bisa 'female' atau 'male'.",
        },
      },
    },
  },
  {
    module: "Person",
    function: "sex",
    description: {
      "zh-CN": "返回一个随机性别。",
      "zh-TW": "返回一個隨機性別。",
      en: "Returns a random sex.",
      ja: "ランダムな性を返します。",
      id: "Mengembalikan jenis kelamin acak.",
    },
    params: {},
  },
  {
    module: "Person",
    function: "sexType",
    description: {
      "zh-CN": "返回一个随机性别类型。",
      "zh-TW": "返回一個隨機性別類型。",
      en: "Returns a random sex type.",
      ja: "ランダムな性別タイプを返します。",
      id: "Mengembalikan jenis kelamin acak.",
    },
    params: {},
  },
  {
    module: "Person",
    function: "suffix",
    description: {
      "zh-CN": "返回一个随机的人称后缀。",
      "zh-TW": "返回一個隨機的人稱後綴。",
      en: "Returns a random person suffix.",
      ja: "ランダムな人名サフィックスを返します。",
      id: "Mengembalikan akhiran orang acak.",
    },
    params: {},
  },
  {
    module: "Person",
    function: "zodiacSign",
    description: {
      "zh-CN": "返回一个随机的星座。",
      "zh-TW": "返回一個隨機的星座。",
      en: "Returns a random zodiac sign.",
      ja: "ランダムな星座を返します。",
      id: "Mengembalikan tanda zodiak acak.",
    },
    params: {},
  },
  {
    module: "Phone",
    function: "imei",
    description: {
      "zh-CN": "生成IMEI号码。",
      "zh-TW": "生成IMEI號碼。",
      en: "Generates IMEI number.",
      ja: "IMEI番号を生成します。",
      id: "Menghasilkan nomor IMEI.",
    },
    params: {},
  },
  {
    module: "Phone",
    function: "number",
    description: {
      "zh-CN": "生成一个随机的电话号码。",
      "zh-TW": "生成一個隨機的電話號碼。",
      en: "Generates a random phone number.",
      ja: "ランダムな電話番号を生成します。",
      id: "Menghasilkan nomor telepon acak.",
    },
    params: {
      style: {
        isrealKey: true,
        type: "enum(human | national | international)",
        default: "human",
        description: {
          "zh-CN": "生成电话号码的样式。",
          "zh-TW": "生成電話號碼的樣式。",
          en: "Style of the generated phone number.",
          ja: "生成される電話番号のスタイル。",
          id: "Gaya nomor telepon yang dihasilkan.",
        },
      },
    },
  },
  {
    module: "Science",
    function: "chemicalElementatomicNumber",
    suffix: "atomicNumber",
    description: {
      "zh-CN": "返回一个随机的元素周期表元素的原子序数",
      "zh-TW": "返回一個隨機的元素週期表元素的原子序數",
      en: "Return the atomic number of a random element from the periodic table.",
      ja: "周期表の要素の中からランダムな要素の原子番号を返す。",
      id: "Kembalikan nomor atom dari suatu elemen tabel periodik secara acak.",
    },
    params: {},
  },
  {
    module: "Science",
    function: "chemicalElementName",
    suffix: "name",
    description: {
      "zh-CN": "返回一个随机的元素周期表元素的名称。",
      "zh-TW": "返回一個隨機的元素週期表元素的名稱。",
      en: "Return the name of a random element from the periodic table.",
      ja: "周期表の要素の中からランダムな要素の名前を返す。",
      id: "Kembalikan nama dari suatu elemen tabel periodik secara acak.",
    },
    params: {},
  },
  {
    module: "Science",
    function: "chemicalElementNumberSymbol",
    suffix: "symbol",
    description: {
      "zh-CN": "返回一个随机的元素周期表元素的符号。",
      "zh-TW": "返回一個隨機的元素週期表元素的符號。",
      en: "Return the symbol of a random element from the periodic table.",
      ja: "周期表の要素の中からランダムな要素の符号を返す。",
      id: "Kembalikan simbol dari suatu elemen tabel periodik secara acak.",
    },
    params: {},
  },
  {
    module: "Science",
    function: "unitName",
    suffix: "name",
    description: {
      "zh-CN": "返回一个随机的科学单位名称。",
      "zh-TW": "返回一個隨機的科學單位名稱。",
      en: "Return the name of a random scientific unit.",
      ja: "ランダムな科学的単位の名前を返す。",
      id: "Kembalikan nama dari suatu satuan ilmu pengetahuan secara acak.",
    },
    params: {},
  },
  {
    module: "Science",
    function: "unitSymbol",
    suffix: "symbol",
    description: {
      "zh-CN": "返回一个随机的科学单位符号。",
      "zh-TW": "返回一個隨機的科學單位符號。",
      en: "Return the symbol of a random scientific unit.",
      ja: "ランダムな科学的単位の符号を返す。",
      id: "Kembalikan simbol dari suatu satuan ilmu pengetahuan secara acak.",
    },
    params: {},
  },
  {
    module: "String",
    function: "alpha",
    description: {
      "zh-CN": "生成由英文字母组成的字符串。",
      "zh-TW": "生成由英文字母組成的字串。",
      en: "Generating a string consisting of letters in the English alphabet.",
      ja: "英字アルファベットから成る文字列を生成します。",
      id: "Menghasilkan string yang terdiri dari huruf dalam alfabet Inggris.",
    },
    params: {
      casing: {
        isrealKey: true,
        type: "enum(lower|upper|mixed)",
        default: "'mixed'",
        description: {
          "zh-CN": "字符的大小写情况。",
          "zh-TW": "字符的大小寫情況。",
          en: "The casing of the characters.",
          ja: "文字の大文字小文字の状況。",
          id: "Kasus huruf-huruf.",
        },
      },
      exclude: {
        isrealKey: true,
        type: "array",
        default: "[]",
        description: {
          "zh-CN": "在生成的字符串中应被排除的字符的数组。",
          "zh-TW": "在生成的字串中應被排除的字符的陣列。",
          en: "An array with characters which should be excluded in the generated string.",
          ja: "生成される文字列で除外すべき文字を含む配列。",
          id: "Array yang berisi karakter-karakter yang harus dikecualikan dalam string yang dihasilkan.",
        },
      },
      length: {
        isrealKey: true,
        type: "number",
        default: 1,
        description: {
          "zh-CN": "要生成的字符串的长度，可以是固定长度，也可以是长度范围。",
          "zh-TW": "要生成的字串的長度，可以是固定長度，也可以是長度範圍。",
          en: "The length of the string to generate either as a fixed length or as a length range.",
          ja: "生成する文字列の長さで、固定長または長さの範囲として指定できます。",
          id: "Panjang string yang akan dihasilkan, baik sebagai panjang tetap atau sebagai rentang panjang.",
        },
      },
      "length.min": {
        isrealKey: true,
        type: "number",
        default: 1,
        description: {
          "zh-CN":
            "要生成的字符串的最小长度。需要同时设置最大长度(max)才会生效。",
          "zh-TW":
            "要生成的字串的最小長度。需要同時設定最大長度(max)才會生效。",
          en: "The minimum length of the string to be generated. It will only take effect when the maximum length (max) is set simultaneously.",
          ja: "生成する文字列の最小長さ。最大長さ（max）を同時に設定しなければ、効力を発揮しません。",
          id: "Panjang minimum dari string yang akan dihasilkan. Hanya akan berlaku jika panjang maksimum (max) diatur secara bersamaan.",
        },
      },
      "length.max": {
        isrealKey: true,
        type: "number",
        default: 5,
        description: {
          "zh-CN":
            "要生成的字符串的最大长度。需要同时设置最小长度(min)才会生效。",
          "zh-TW":
            "要生成的字串的最大長度。需要同時設定最小長度(min)才會生效。",
          en: "The maximum length of the string to be generated. It will only take effect when the minimum length (min) is set simultaneously.",
          ja: "生成する文字列の最大長さ。最小長さ（min）を同時に設定しなければ、効力を発揮しません。",
          id: "Panjang maksimum dari string yang akan dihasilkan. Hanya akan berlaku jika panjang minimum (min) diatur secara bersamaan.",
        },
      },
    },
  },
  {
    module: "String",
    function: "alphanumeric",
    description: {
      "zh-CN": "生成由字母和数字组成的字符串。",
      "zh-TW": "生成由字母和數字組成的字串。",
      en: "Generating a string consisting of alpha characters and digits.",
      ja: "アルファ文字と数字から成る文字列を生成します。",
      id: "Menghasilkan string yang terdiri dari karakter huruf dan digit.",
    },
    params: {
      casing: {
        isrealKey: true,
        type: "enum(lower|upper|mixed)",
        default: "'mixed'",
        description: {
          "zh-CN": "字符的大小写情况。",
          "zh-TW": "字符的大小寫情況。",
          en: "The casing of the characters.",
          ja: "文字の大文字小文字の状況。",
          id: "Kasus huruf-huruf.",
        },
      },
      exclude: {
        isrealKey: true,
        type: "array",
        default: "[]",
        description: {
          "zh-CN": "在生成的字符串中应被排除的字符和数字的数组。",
          "zh-TW": "在生成的字串中應被排除的字符和數字的陣列。",
          en: "An array of characters and digits which should be excluded in the generated string.",
          ja: "生成される文字列で除外すべき文字と数字を含む配列。",
          id: "Array karakter dan digit yang harus dikecualikan dalam string yang dihasilkan.",
        },
      },
      length: {
        isrealKey: true,
        type: "number",
        default: 1,
        description: {
          "zh-CN": "要生成的字符串的长度，可以是固定长度，也可以是长度范围。",
          "zh-TW": "要生成的字串的長度，可以是固定長度，也可以是長度範圍。",
          en: "The length of the string to generate either as a fixed length or as a length range.",
          ja: "生成する文字列の長さで、固定長または長さの範囲として指定できます。",
          id: "Panjang string yang akan dihasilkan, baik sebagai panjang tetap atau sebagai rentang panjang.",
        },
      },
      "length.min": {
        isrealKey: true,
        type: "number",
        default: 1,
        description: {
          "zh-CN":
            "要生成的字符串的最小长度。需要同时设置最大长度(max)才会生效。",
          "zh-TW":
            "要生成的字串的最小長度。需要同時設定最大長度(max)才會生效。",
          en: "The minimum length of the string to be generated. It will only take effect when the maximum length (max) is set simultaneously.",
          ja: "生成する文字列の最小長さ。最大長さ（max）を同時に設定しなければ、効力を発揮しません。",
          id: "Panjang minimum dari string yang akan dihasilkan. Hanya akan berlaku jika panjang maksimum (max) diatur secara bersamaan.",
        },
      },
      "length.max": {
        isrealKey: true,
        type: "number",
        default: 5,
        description: {
          "zh-CN":
            "要生成的字符串的最大长度。需要同时设置最小长度(min)才会生效。",
          "zh-TW":
            "要生成的字串的最大長度。需要同時設定最小長度(min)才會生效。",
          en: "The maximum length of the string to be generated. It will only take effect when the minimum length (min) is set simultaneously.",
          ja: "生成する文字列の最大長さ。最小長さ（min）を同時に設定しなければ、効力を発揮しません。",
          id: "Panjang maksimum dari string yang akan dihasilkan. Hanya akan berlaku jika panjang minimum (min) diatur secara bersamaan.",
        },
      },
    },
  },
  {
    module: "String",
    function: "binary",
    description: {
      "zh-CN": "返回一个二进制字符串。",
      "zh-TW": "返回一個二進位字串。",
      en: "Returns a binary string.",
      ja: "バイナリ文字列を返します。",
      id: "Mengembalikan string biner.",
    },
    params: {
      length: {
        isrealKey: true,
        type: "number",
        default: 1,
        description: {
          "zh-CN":
            "要生成的字符串（不包括前缀）的长度，可以是固定长度，也可以是长度范围。",
          "zh-TW":
            "要生成的字串（不包括前綴）的長度，可以是固定長度，也可以是長度範圍。",
          en: "The length of the string (excluding the prefix) to generate either as a fixed length or as a length range.",
          ja: "生成する文字列（接頭辞を除く）の長さで、固定長または長さの範囲として指定できます。",
          id: "Panjang string (tanpa awalan) yang akan dihasilkan, baik sebagai panjang tetap atau sebagai rentang panjang.",
        },
      },
      "length.min": {
        isrealKey: true,
        type: "number",
        default: 1,
        description: {
          "zh-CN":
            "要生成的字符串的最小长度。需要同时设置最大长度(max)才会生效。",
          "zh-TW":
            "要生成的字串的最小長度。需要同時設定最大長度(max)才會生效。",
          en: "The minimum length of the string to be generated. It will only take effect when the maximum length (max) is set simultaneously.",
          ja: "生成する文字列の最小長さ。最大長さ（max）を同時に設定しなければ、効力を発揮しません。",
          id: "Panjang minimum dari string yang akan dihasilkan. Hanya akan berlaku jika panjang maksimum (max) diatur secara bersamaan.",
        },
      },
      "length.max": {
        isrealKey: true,
        type: "number",
        default: 5,
        description: {
          "zh-CN":
            "要生成的字符串的最大长度。需要同时设置最小长度(min)才会生效。",
          "zh-TW":
            "要生成的字串的最大長度。需要同時設定最小長度(min)才會生效。",
          en: "The maximum length of the string to be generated. It will only take effect when the minimum length (min) is set simultaneously.",
          ja: "生成する文字列の最大長さ。最小長さ（min）を同時に設定しなければ、効力を発揮しません。",
          id: "Panjang maksimum dari string yang akan dihasilkan. Hanya akan berlaku jika panjang minimum (min) diatur secara bersamaan.",
        },
      },
      prefix: {
        isrealKey: true,
        type: "string",
        default: "'0b'",
        description: {
          "zh-CN": "生成数字的前缀。",
          "zh-TW": "生成數字的前綴。",
          en: "Prefix for the generated number.",
          ja: "生成される数字の接頭辞。",
          id: "Awalan untuk nomor yang dihasilkan.",
        },
      },
    },
  },
  {
    module: "String",
    function: "fromCharacters",
    description: {
      "zh-CN": "根据给定字符生成字符串。",
      "zh-TW": "根據給定字元生成字串。",
      en: "Generates a string from the given characters.",
      ja: "指定した文字から文字列を生成します。",
      id: "Menghasilkan string dari karakter yang diberikan.",
    },
    params: {
      characters: {
        isrealKey: false,
        type: "array",
        default: "",
        description: {
          "zh-CN":
            "用于字符串的字符。可以是一个字符串，也可以是一个字符数组。如果是数组，那么即便其中某个元素是包含多个字符的字符串，也会将其当作单个字符来处理。",
          "zh-TW":
            "用於字串的字符。可以是一個字串，也可以是一個字符陣列。如果是陣列，那麼即便其中某個元素是包含多個字符的字串，也會將其當作單個字符來處理。",
          en: "The characters to use for the string. Can be a string or an array of characters. If it is an array, then each element is treated as a single character even if it is a string with multiple characters.",
          ja: "文字列に使用する文字。文字列または文字の配列であることができます。配列の場合、要素が複数の文字を含む文字列であっても、それぞれを単一の文字として扱います。",
          id: "Karakter-karakter yang akan digunakan untuk string. Bisa menjadi string atau array karakter. Jika itu adalah array, maka setiap elemen diperlakukan sebagai satu karakter bahkan jika itu adalah string dengan beberapa karakter.",
        },
      },
      length: {
        isrealKey: false,
        type: "number",
        default: 1,
        description: {
          "zh-CN":
            "要生成的字符串的长度，可以设定为固定长度，也可以设定为一个长度范围。",
          "zh-TW":
            "要生成的字串的長度，可以設定為固定長度，也可以設定為一個長度範圍。",
          en: "The length of the string to generate either as a fixed length or as a length range.",
          ja: "生成する文字列の長さは、固定長または長さの範囲として設定できます。",
          id: "Panjang string yang akan dihasilkan, baik sebagai panjang tetap atau sebagai rentang panjang.",
        },
      },
      min: {
        isrealKey: true,
        type: "number",
        default: 1,
        description: {
          "zh-CN":
            "要生成的字符串的最小长度。需要同时设置最大长度(max)才会生效。",
          "zh-TW":
            "要生成的字串的最小長度。需要同時設定最大長度(max)才會生效。",
          en: "The minimum length of the string to be generated. It will only take effect when the maximum length (max) is set simultaneously.",
          ja: "生成する文字列の最小長さ。最大長さ（max）を同時に設定しなければ、効力を発揮しません。",
          id: "Panjang minimum dari string yang akan dihasilkan. Hanya akan berlaku jika panjang maksimum (max) diatur secara bersamaan.",
        },
      },
      max: {
        isrealKey: true,
        type: "number",
        default: 5,
        description: {
          "zh-CN":
            "要生成的字符串的最大长度。需要同时设置最小长度(min)才会生效。",
          "zh-TW":
            "要生成的字串的最大長度。需要同時設定最小長度(min)才會生效。",
          en: "The maximum length of the string to be generated. It will only take effect when the minimum length (min) is set simultaneously.",
          ja: "生成する文字列の最大長さ。最小長さ（min）を同時に設定しなければ、効力を発揮しません。",
          id: "Panjang maksimum dari string yang akan dihasilkan. Hanya akan berlaku jika panjang minimum (min) diatur secara bersamaan.",
        },
      },
    },
  },
  {
    module: "String",
    function: "hexadecimal",
    description: {
      "zh-CN": "返回一个十六进制字符串。",
      "zh-TW": "返回一個十六進位字串。",
      en: "Returns a hexadecimal string.",
      ja: "16進数の文字列を返します。",
      id: "Mengembalikan string heksadesimal.",
    },
    params: {
      casing: {
        isrealKey: true,
        type: "enum(lower|upper|mixed)",
        default: "'mixed'",
        description: {
          "zh-CN": "生成数字的大小写情况。",
          "zh-TW": "生成數字的大小寫情況。",
          en: "Casing of the generated number.",
          ja: "生成される数字の大文字小文字の状況。",
          id: "Kasus huruf-huruf dari nomor yang dihasilkan.",
        },
      },
      length: {
        isrealKey: true,
        type: "number",
        default: 1,
        description: {
          "zh-CN":
            "要生成的字符串（不包括前缀）的长度，可以是固定长度，也可以是长度范围。",
          "zh-TW":
            "要生成的字串（不包括前綴）的長度，可以是固定長度，也可以是長度範圍。",
          en: "The length of the string (excluding the prefix) to generate either as a fixed length or as a length range.",
          ja: "生成する文字列（接頭辞を除く）の長さで、固定長または長さの範囲として指定できます。",
          id: "Panjang string (tanpa awalan) yang akan dihasilkan, baik sebagai panjang tetap atau sebagai rentang panjang.",
        },
      },
      "length.min": {
        isrealKey: true,
        type: "number",
        default: 1,
        description: {
          "zh-CN":
            "要生成的字符串的最小长度。需要同时设置最大长度(max)才会生效。",
          "zh-TW":
            "要生成的字串的最小長度。需要同時設定最大長度(max)才會生效。",
          en: "The minimum length of the string to be generated. It will only take effect when the maximum length (max) is set simultaneously.",
          ja: "生成する文字列の最小長さ。最大長さ（max）を同時に設定しなければ、効力を発揮しません。",
          id: "Panjang minimum dari string yang akan dihasilkan. Hanya akan berlaku jika panjang maksimum (max) diatur secara bersamaan.",
        },
      },
      "length.max": {
        isrealKey: true,
        type: "number",
        default: 5,
        description: {
          "zh-CN":
            "要生成的字符串的最大长度。需要同时设置最小长度(min)才会生效。",
          "zh-TW":
            "要生成的字串的最大長度。需要同時設定最小長度(min)才會生效。",
          en: "The maximum length of the string to be generated. It will only take effect when the minimum length (min) is set simultaneously.",
          ja: "生成する文字列の最大長さ。最小長さ（min）を同時に設定しなければ、効力を発揮しません。",
          id: "Panjang maksimum dari string yang akan dihasilkan. Hanya akan berlaku jika panjang minimum (min) diatur secara bersamaan.",
        },
      },
      prefix: {
        isrealKey: true,
        type: "string",
        default: "'0x'",
        description: {
          "zh-CN": "生成数字的前缀。",
          "zh-TW": "生成數字的前綴。",
          en: "Prefix for the generated number.",
          ja: "生成される数字の接頭辞。",
          id: "Awalan untuk nomor yang dihasilkan.",
        },
      },
    },
  },
  {
    module: "String",
    function: "nanoid",
    description: {
      "zh-CN": "生成一个Nano ID。",
      "zh-TW": "生成一個Nano ID。",
      en: "Generates a Nano ID.",
      ja: "Nano IDを生成します。",
      id: "Menghasilkan Nano ID.",
    },
    params: {
      length: {
        isrealKey: false,
        type: "number",
        default: 21,
        description: {
          "zh-CN":
            "要生成的字符串的长度可以设定为固定长度，也可以设定为一个长度范围。",
          "zh-TW":
            "要生成的字串的長度可以設定為固定長度，也可以設定為一個長度範圍。",
          en: "The length of the string to generate either as a fixed length or as a length range. ",
          ja: "生成する文字列の長さは、固定長または長さの範囲として設定できます。",
          id: "Panjang string yang akan dihasilkan, baik sebagai panjang tetap atau sebagai rentang panjang.  ",
        },
      },
      max: {
        isrealKey: true,
        type: "number",
        default: "",
        description: {
          "zh-CN":
            "要生成的Nano ID的最大长度。需要同时设置最小长度(min)才会生效。",
          "zh-TW":
            "要生成的Nano ID的最大長度。需要同時設定最小長度(min)才會生效。",
          en: "The maximum length of the Nano ID to be generated. It will only take effect when the minimum length (min) is set simultaneously.",
          ja: "生成するNano IDの最大長さ。最小長さ（min）を同時に設定しなければ、効力を発揮しません。",
          id: "Panjang maksimum dari Nano ID yang akan dihasilkan. Hanya akan berlaku jika panjang minimum (min) diatur secara bersamaan.",
        },
      },
      min: {
        isrealKey: true,
        type: "number",
        default: "",
        description: {
          "zh-CN":
            "要生成的Nano ID的最小长度。需要同时设置最大长度(max)才会生效。",
          "zh-TW":
            "要生成的Nano ID的最小長度。需要同時設定最大長度(max)才會生效。",
          en: "The minimum length of the Nano ID to be generated. It will only take effect when the maximum length (max) is set simultaneously.",
          ja: "生成するNano IDの最小長さ。最大長さ（max）を同時に設定しなければ、効力を発揮しません。",
          id: "Panjang minimum dari Nano ID yang akan dihasilkan. Hanya akan berlaku jika panjang maksimum (max) diatur secara bersamaan.",
        },
      },
    },
  },
  {
    module: "String",
    function: "numeric",
    description: {
      "zh-CN": "生成指定长度的数字字符串。",
      "zh-TW": "生成指定長度的數字字串。",
      en: "Generates a given length string of digits.",
      ja: "指定された長さの数字の文字列を生成します。",
      id: "Menghasilkan string digit dengan panjang yang ditentukan.",
    },
    params: {
      allowLeadingZeros: {
        isrealKey: true,
        type: "boolean",
        default: "true",
        description: {
          "zh-CN": "是否允许有前导零。",
          "zh-TW": "是否允許有前導零。",
          en: "Whether leading zeros are allowed or not.",
          ja: "先頭のゼロを許可するかどうか。",
          id: "Apakah nol-nol awal diperbolehkan atau tidak.",
        },
      },
      exclude: {
        isrealKey: true,
        type: "array",
        default: "[]",
        description: {
          "zh-CN": "在生成的字符串中被排除的数字数组。",
          "zh-TW": "在生成的字串中被排除的數字陣列。",
          en: "An array of digits which should be excluded in the generated string.",
          ja: "生成される文字列から除外すべき数字の配列。",
          id: "Array digit yang harus dikecualikan dalam string yang dihasilkan.",
        },
      },
      length: {
        isrealKey: true,
        type: "number",
        default: 1,
        description: {
          "zh-CN":
            "要生成的字符串的长度，可以设定为固定长度，也可以设定为一个长度范围。",
          "zh-TW":
            "要生成的字串的長度，可以設定為固定長度，也可以設定為一個長度範圍。",
          en: "The length of the string to generate either as a fixed length or as a length range.",
          ja: "生成する文字列の長さは、固定長または長さの範囲として設定できます。",
          id: "Panjang string yang akan dihasilkan, baik sebagai panjang tetap atau sebagai rentang panjang.",
        },
      },
      "length.min": {
        isrealKey: true,
        type: "number",
        default: 1,
        description: {
          "zh-CN":
            "要生成的字符串的最小长度。需要同时设置最大长度(max)才会生效。",
          "zh-TW":
            "要生成的字串的最小長度。需要同時設定最大長度(max)才會生效。",
          en: "The minimum length of the string to be generated. It will only take effect when the maximum length (max) is set simultaneously.",
          ja: "生成する文字列の最小長さ。最大長さ（max）を同時に設定しなければ、効力を発揮しません。",
          id: "Panjang minimum dari string yang akan dihasilkan. Hanya akan berlaku jika panjang maksimum (max) diatur secara bersamaan.",
        },
      },
      "length.max": {
        isrealKey: true,
        type: "number",
        default: 5,
        description: {
          "zh-CN":
            "要生成的字符串的最大长度。需要同时设置最小长度(min)才会生效。",
          "zh-TW":
            "要生成的字串的最大長度。需要同時設定最小長度(min)才會生效。",
          en: "The maximum length of the string to be generated. It will only take effect when the minimum length (min) is set simultaneously.",
          ja: "生成する文字列の最大長さ。最小長さ（min）を同時に設定しなければ、効力を発揮しません。",
          id: "Panjang maksimum dari string yang akan dihasilkan. Hanya akan berlaku jika panjang minimum (min) diatur secara bersamaan.",
        },
      },
    },
  },
  {
    module: "String",
    function: "octal",
    description: {
      "zh-CN": "返回一个八进制字符串。",
      "zh-TW": "返回一個八進位字串。",
      en: "Returns an octal string.",
      ja: "8進数の文字列を返します。",
      id: "Mengembalikan string okta.",
    },
    params: {
      length: {
        isrealKey: true,
        type: "number",
        default: 1,
        description: {
          "zh-CN":
            "要生成的字符串（不包括前缀）的长度，可以设定为固定长度，也可以设定为一个长度范围。",
          "zh-TW":
            "要生成的字串（不包括前綴）的長度，可以設定為固定長度，也可以設定為一個長度範圍。",
          en: "The length of the string (excluding the prefix) to generate either as a fixed length or as a length range.",
          ja: "生成する文字列（接頭辞を除く）の長さは、固定長または長さの範囲として設定できます。",
          id: "Panjang string (tanpa awalan) yang akan dihasilkan, baik sebagai panjang tetap atau sebagai rentang panjang.",
        },
      },
      "length.min": {
        isrealKey: true,
        type: "number",
        default: 1,
        description: {
          "zh-CN":
            "要生成的字符串的最小长度。需要同时设置最大长度(max)才会生效。",
          "zh-TW":
            "要生成的字串的最小長度。需要同時設定最大長度(max)才會生效。",
          en: "The minimum length of the string to be generated. It will only take effect when the maximum length (max) is set simultaneously.",
          ja: "生成する文字列の最小長さ。最大長さ（max）を同時に設定しなければ、効力を発揮しません。",
          id: "Panjang minimum dari string yang akan dihasilkan. Hanya akan berlaku jika panjang maksimum (max) diatur secara bersamaan.",
        },
      },
      "length.max": {
        isrealKey: true,
        type: "number",
        default: 5,
        description: {
          "zh-CN":
            "要生成的字符串的最大长度。需要同时设置最小长度(min)才会生效。",
          "zh-TW":
            "要生成的字串的最大長度。需要同時設定最小長度(min)才會生效。",
          en: "The maximum length of the string to be generated. It will only take effect when the minimum length (min) is set simultaneously.",
          ja: "生成する文字列の最大長さ。最小長さ（min）を同時に設定しなければ、効力を発揮しません。",
          id: "Panjang maksimum dari string yang akan dihasilkan. Hanya akan berlaku jika panjang minimum (min) diatur secara bersamaan.",
        },
      },
      prefix: {
        isrealKey: true,
        type: "string",
        default: "'0o'",
        description: {
          "zh-CN": "生成数字的前缀。",
          "zh-TW": "生成數字的前綴。",
          en: "Prefix for the generated number.",
          ja: "生成される数字の接頭辞。",
          id: "Awalan untuk nomor yang dihasilkan.",
        },
      },
    },
  },
  {
    module: "String",
    function: "sample",
    description: {
      "zh-CN": "返回包含UTF-16字符的字符串，范围在33到125之间（!到}）。",
      "zh-TW": "返回包含UTF-16字元的字串，範圍在33到125之間（！到}）。",
      en: "Returns a string containing UTF-16 chars between 33 and 125 (! to }).",
      ja: "33から125までのUTF-16文字を含む文字列を返します（！から}まで）。",
      id: "Mengembalikan string yang berisi karakter UTF-16 antara 33 dan 125 (! hingga }).",
    },
    params: {
      length: {
        isrealKey: false,
        type: "number",
        default: 10,
        description: {
          "zh-CN":
            "要生成的字符串（不包括前缀）的长度，可以设定为固定长度，也可以设定为一个长度范围。",
          "zh-TW":
            "要生成的字串（不包括前綴）的長度，可以設定為固定長度，也可以設定為一個長度範圍。",
          en: "The length of the string (excluding the prefix) to generate either as a fixed length or as a length range.",
          ja: "生成する文字列（接頭辞を除く）の長さは、固定長または長さの範囲として設定できます。",
          id: "Panjang string (tanpa awalan) yang akan dihasilkan, baik sebagai panjang tetap atau sebagai rentang panjang.",
        },
      },
      max: {
        isrealKey: true,
        type: "number",
        default: "",
        description: {
          "zh-CN":
            "要生成的字符串的最大长度。需要同时设置最小长度(min)才会生效。",
          "zh-TW":
            "要生成的字串的最大長度。需要同時設定最小長度(min)才會生效。",
          en: "The maximum length of the string to be generated. It will only take effect when the minimum length (min) is set simultaneously.",
          ja: "生成する文字列の最大長さ。最小長さ（min）を同時に設定しなければ、効力を発揮しません。",
          id: "Panjang maksimum dari string yang akan dihasilkan. Hanya akan berlaku jika panjang minimum (min) diatur secara bersamaan.",
        },
      },
      min: {
        isrealKey: true,
        type: "number",
        default: "",
        description: {
          "zh-CN":
            "要生成的字符串的最小长度。需要同时设置最大长度(max)才会生效。",
          "zh-TW":
            "要生成的字串的最小長度。需要同時設定最大長度(max)才會生效。",
          en: "The minimum length of the string to be generated. It will only take effect when the maximum length (max) is set simultaneously.",
          ja: "生成する文字列の最小長さ。最大長さ（max）を同時に設定しなければ、効力を発揮しません。",
          id: "Panjang minimum dari string yang akan dihasilkan. Hanya akan berlaku jika panjang maksimum (max) diatur secara bersamaan.",
        },
      },
    },
  },
  {
    module: "String",
    function: "symbol",
    description: {
      "zh-CN": "返回仅包含特殊字符的字符串。",
      "zh-TW": "返回僅包含特殊字元的字串。",
      en: "Returns a string containing only special characters.",
      ja: "特殊文字のみを含む文字列を返します。",
      id: "Mengembalikan string yang hanya berisi karakter khusus.",
    },
    params: {
      length: {
        isrealKey: false,
        type: "number",
        default: 1,
        description: {
          "zh-CN":
            "要生成的字符串的长度，可以设定为固定长度，也可以设定为一个长度范围。",
          "zh-TW":
            "要生成的字串的長度，可以設定為固定長度，也可以設定為一個長度範圍。",
          en: "The length of the string to generate either as a fixed length or as a length range.",
          ja: "生成する文字列の長さは、固定長または長さの範囲として設定できます。",
          id: "Panjang string yang akan dihasilkan, baik sebagai panjang tetap atau sebagai rentang panjang.",
        },
      },
      max: {
        isrealKey: true,
        type: "number",
        default: "",
        description: {
          "zh-CN":
            "要生成的字符串的最大长度。需要同时设置最小长度(min)才会生效。",
          "zh-TW":
            "要生成的字串的最大長度。需要同時設定最小長度(min)才會生效。",
          en: "The maximum length of the string to be generated. It will only take effect when the minimum length (min) is set simultaneously.",
          ja: "生成する文字列の最大長さ。最小長さ（min）を同時に設定しなければ、効力を発揮しません。",
          id: "Panjang maksimum dari string yang akan dihasilkan. Hanya akan berlaku jika panjang minimum (min) diatur secara bersamaan.",
        },
      },
      min: {
        isrealKey: true,
        type: "number",
        default: "",
        description: {
          "zh-CN":
            "要生成的字符串的最小长度。需要同时设置最大长度(max)才会生效。",
          "zh-TW":
            "要生成的字串的最小長度。需要同時設定最大長度(max)才會生效。",
          en: "The minimum length of the string to be generated. It will only take effect when the maximum length (max) is set simultaneously.",
          ja: "生成する文字列の最小長さ。最大長さ（max）を同時に設定しなければ、効力を発揮しません。",
          id: "Panjang minimum dari string yang akan dihasilkan. Hanya akan berlaku jika panjang maksimum (max) diatur secara bersamaan.",
        },
      },
    },
  },
  {
    module: "String",
    function: "ulid",
    description: {
      "zh-CN": "返回一个ULID。",
      "zh-TW": "返回一個ULID。",
      en: "Returns a ULID",
      ja: "ULIDを返します。",
      id: "Mengembalikan ULID.",
    },
    params: {
      refDate: {
        isrealKey: true,
        type: "Date",
        default: "faker.defaultRefDate()",
        description: {
          "zh-CN":
            "用作新生成的ULID编码时间戳参考点的日期。编码时间戳由结果的前10个字符表示。",
          "zh-TW":
            "用作新生成的ULID編碼時間戳參考點的日期。編碼時間戳由結果的前10個字符表示。",
          en: "The date to use as reference point for the newly generated ULID encoded timestamp. The encoded timestamp is represented by the first 10 characters of the result.",
          ja: "新しく生成されるULIDエンコードタイムスタンプの基準点として使用する日付。エンコードタイムスタンプは、結果の最初の10文字で表されます。",
          id: "Tanggal yang digunakan sebagai titik referensi untuk timestamp ULID yang baru dihasilkan. Timestamp yang dikodekan diwakili oleh 10 karakter pertama dari hasilnya.",
        },
      },
    },
  },
  {
    module: "String",
    function: "uuid",
    description: {
      "zh-CN": "返回一个UUID v4。",
      "zh-TW": "返回一個UUID v4。",
      en: "Returns a UUID v4.",
      ja: "UUID v4を返します。",
      id: "Mengembalikan UUID v4.",
    },
    params: {},
  },
  {
    module: "System",
    function: "commonFileExt",
    description: {
      "zh-CN": "返回常用的文件扩展名。",
      "zh-TW": "返回常用的檔案副檔名。",
      en: "Returns a commonly used file extension.",
      ja: "一般的なファイル拡張子を返します。",
      id: "Mengembalikan ekstensi file yang umum digunakan.",
    },
    params: {},
  },
  {
    module: "System",
    function: "commonFileName",
    description: {
      "zh-CN": "返回带有给定扩展名或常用扩展名的随机文件名。",
      "zh-TW": "返回帶有給定副檔名或常用副檔名的隨機檔案名稱。",
      en: "Returns a random file name with a given extension or a commonly used extension.",
      ja: "指定された拡張子または一般的な拡張子を持つランダムなファイル名を返します。",
      id: "Mengembalikan nama file acak dengan ekstensi yang diberikan atau ekstensi yang umum digunakan.",
    },
    params: {
      ext: {
        isrealKey: false,
        type: "string",
        default: "",
        description: {
          "zh-CN": "扩展名。空字符串被视为未设置。",
          "zh-TW": "副檔名。空字串被視為未設定。",
          en: "Extension. Empty string is considered to be not set.",
          ja: "拡張子。空文字列は設定されていないものと見なされます。",
          id: "Ekstensi. String kosong dianggap tidak diatur.",
        },
      },
    },
  },
  {
    module: "System",
    function: "commonFileType",
    description: {
      "zh-CN": "返回常用的文件类型。",
      "zh-TW": "返回常用的檔案類型。",
      en: "Returns a commonly used file type.",
      ja: "一般的なファイルタイプを返します。",
      id: "Mengembalikan jenis file yang umum digunakan.",
    },
    params: {},
  },
  {
    module: "System",
    function: "cron",
    description: {
      "zh-CN": "返回一个随机的cron表达式。",
      "zh-TW": "返回一個隨機的cron表達式。",
      en: "Returns a random cron expression.",
      ja: "ランダムなcron式を返します。",
      id: "Mengembalikan ekspresi cron acak.",
    },
    params: {
      includeNonStandard: {
        isrealKey: true,
        type: "boolean",
        default: "false",
        description: {
          "zh-CN":
            "是否要在生成的表达式中包含诸如@yearly（每年）、@monthly（每月）、@daily（每日）等文本标签。",
          "zh-TW":
            "是否要在生成的表達式中包含諸如@yearly（每年）、@monthly（每月）、@daily（每日）等文本標籤。",
          en: "Whether to include a @yearly, @monthly, @daily, etc text labels in the generated expression.",
          ja: "生成される式に@yearly、@monthly、@dailyなどのテキストラベルを含めるかどうか。",
          id: "Apakah akan menyertakan label teks seperti @yearly, @monthly, @daily, dll dalam ekspresi yang dihasilkan.",
        },
      },
      includeYear: {
        isrealKey: true,
        type: "boolean",
        default: "false",
        description: {
          "zh-CN": "是否要在生成的表达式中包含年份。",
          "zh-TW": "是否要在生成的表達式中包含年份。",
          en: "Whether to include a year in the generated expression.",
          ja: "生成される式に年を含めるかどうか。",
          id: "Apakah akan menyertakan tahun dalam ekspresi yang dihasilkan.",
        },
      },
    },
  },
  {
    module: "System",
    function: "directoryPath",
    description: {
      "zh-CN": "返回一个目录路径。",
      "zh-TW": "返回一個目錄路徑。",
      en: "Returns a directory path.",
      ja: "ディレクトリパスを返します。",
      id: "Mengembalikan path direktori.",
    },
    params: {},
  },
  {
    module: "System",
    function: "fileExt",
    description: {
      "zh-CN": "返回文件扩展名。",
      "zh-TW": "返回檔案副檔名。",
      en: "Returns a file extension.",
      ja: "ファイル拡張子を返します。",
      id: "Mengembalikan ekstensi file.",
    },
    params: {
      mimeType: {
        isrealKey: false,
        type: "string",
        default: "",
        description: {
          "zh-CN": "有效的MIME类型。",
          "zh-TW": "有效的MIME類型。",
          en: "Valid mime-type.",
          ja: "有効なMIMEタイプ。",
          id: "Tipe MIME yang valid.",
        },
      },
    },
  },
  {
    module: "System",
    function: "fileName",
    description: {
      "zh-CN": "返回一个带扩展名的随机文件名。",
      "zh-TW": "返回一個帶副檔名的隨機檔案名稱。",
      en: "Returns a random file name with extension.",
      ja: "拡張子付きのランダムなファイル名を返します。",
      id: "Mengembalikan nama file acak dengan ekstensi.",
    },
    params: {
      extensionCount: {
        isrealKey: true,
        type: "number",
        default: 1,
        description: {
          "zh-CN": "定义文件名应该有多少个扩展名。",
          "zh-TW": "定義檔名應該有多少個副檔名。",
          en: "Define how many extensions the file name should have.",
          ja: "ファイル名にどのくらいの拡張子を持たせるかを定義する。",
          id: "Tentukan berapa banyak ekstensi yang harus dimiliki nama file.",
        },
      },
      "extensionCount.min": {
        isrealKey: true,
        type: "number",
        default: 1,
        description: {
          "zh-CN": "最小数量，需要同时设置最大数量（max）才会生效。",
          "zh-TW": "最小數量，需要同時設定最大數量（max）才會生效。",
          en: "The minimum quantity. It will only take effect when the maximum quantity (max) is set simultaneously.",
          ja: "最小数量。最大数量（max）を同時に設定しなければ、効力を発揮しません。",
          id: "Jumlah minimum. Hanya akan berlaku jika jumlah maksimum (max) diatur secara bersamaan.",
        },
      },
      "extensionCount.max": {
        isrealKey: true,
        type: "number",
        default: 1,
        description: {
          "zh-CN": "最大数量，需要同时设置最小数量（min）才会生效。",
          "zh-TW": "最大數量，需要同時設定最小數量（min）才會生效。",
          en: "The maximum quantity. It will only take effect when the minimum quantity (min) is set simultaneously.",
          ja: "最大数量。最小数量（min）を同時に設定しなければ、効力を発揮しません。",
          id: "Jumlah maksimum. Hanya akan berlaku jika jumlah minimum (min) diatur secara bersamaan.",
        },
      },
    },
  },
  {
    module: "System",
    function: "filePath",
    description: {
      "zh-CN": "返回一个文件路径。",
      "zh-TW": "返回一個檔案路徑。",
      en: "Returns a file path.",
      ja: "ファイルパスを返します。",
      id: "Mengembalikan path file.",
    },
    params: {},
  },
  {
    module: "System",
    function: "fileType",
    description: {
      "zh-CN": "返回文件类型。",
      "zh-TW": "返回檔案類型。",
      en: "Returns a file type.",
      ja: "ファイルタイプを返します。",
      id: "Mengembalikan jenis file.",
    },
    params: {},
  },
  {
    module: "System",
    function: "mimeType",
    description: {
      "zh-CN": "返回文件的mime类型。",
      "zh-TW": "返回檔案的mime類型。",
      en: "Returns a mime-type.",
      ja: "mimeタイプを返します。",
      id: "Mengembalikan mime-type.",
    },
    params: {},
  },
  {
    module: "System",
    function: "networkInterface",
    description: {
      "zh-CN": "返回一个随机的网络接口。",
      "zh-TW": "返回一個隨機的網路介面。",
      en: "Returns a random network interface.",
      ja: "ランダムなネットワークインターフェースを返します。",
      id: "Mengembalikan antarmuka jaringan acak.",
    },
    params: {
      interfaceSchema: {
        isrealKey: true,
        type: "enum(index | slot | mac | pci)",
        default: "faker.helpers.objectKey(['index' | 'slot' | 'mac' | 'pci'])",
        description: {
          "zh-CN":
            "接口模式。可以是索引（index）、插槽（slot）、MAC（媒体访问控制）地址、PCI（周边元件扩展接口）中的一种。",
          "zh-TW":
            "API架構。可以是索引、插槽、MAC（媒體存取控制）位址、PCI（周邊元件擴展介面）其中之一。",
          en: "The interface schema. Can be one of index, slot, mac, pci.",
          ja: "インターフェースのスキーマ。index（インデックス）、slot（スロット）、mac（メディアアクセス制御）、pci（パーソナルコンピュータインターフェース）のいずれかです。",
          id: "Skema antarmuka. Bisa salah satu dari index, slot, mac, pci.",
        },
      },
      interfaceType: {
        isrealKey: true,
        type: "enum(en | wl | ww)",
        default: "faker.helpers.arrayElement(['en', 'wl', 'ww'])",
        description: {
          "zh-CN":
            "接口类型。可以是en（以太网接口，通常用于有线网络连接）、wl（无线局域网接口，用于无线网络连接）、ww（具体含义可能因不同情境或设备而异的一种接口类型）中的一种。",
          "zh-TW":
            "API類型。可以是en（乙太網路介面，通常用於有線網路連接）、wl（無線區域網路介面，用於無線網路連接）、ww（其具體含義可能因不同情境或設備而異的一種介面類型）其中之一。",
          en: "The interface type. Can be one of en, wl, ww.",
          ja: "インターフェースのタイプ。en（イーサネットインターフェース、通常は有線ネットワーク接続に使用）、wl（ワイヤレスLANインターフェース、ワイヤレスネットワーク接続に使用）、ww（状況や機器によって意味が異なる可能性のあるインターフェースタイプ）のいずれかです。",
          id: "Tipe antarmuka. Bisa salah satu dari en, wl, ww.",
        },
      },
    },
  },
  {
    module: "System",
    function: "semver",
    description: {
      "zh-CN": "返回一个语义版本。",
      "zh-TW": "返回一個語意版本。",
      en: "Returns a semantic version.",
      ja: "セマンティックバージョンを返します。",
      id: "Mengembalikan versi semantik.",
    },
    params: {},
  },
  {
    module: "Vehicle",
    function: "bicycle",
    description: {
      "zh-CN": "返回一种类型的自行车。",
      "zh-TW": "返回一種類型的自行車。",
      en: "Returns a type of bicycle.",
      ja: "自転車の種類を返します。",
      id: "Mengembalikan jenis sepeda.",
    },
    params: {},
  },
  {
    module: "Vehicle",
    function: "color",
    description: {
      "zh-CN": "返回一种车辆颜色。",
      "zh-TW": "返回一種車輛顏色。",
      en: "Returns a vehicle color.",
      ja: "車両の色を返します。",
      id: "Mengembalikan warna kendaraan.",
    },
    params: {},
  },
  {
    module: "Vehicle",
    function: "fuel",
    description: {
      "zh-CN": "返回一种燃料类型。",
      "zh-TW": "返回一種燃料類型。",
      en: "Returns a fuel type.",
      ja: "燃料の種類を返します。",
      id: "Mengembalikan jenis bahan bakar.",
    },
    params: {},
  },
  {
    module: "Vehicle",
    function: "manufacturer",
    description: {
      "zh-CN": "返回制造商名称。",
      "zh-TW": "返回製造商名稱。",
      en: "Returns a manufacturer name.",
      ja: "製造者の名前を返します。",
      id: "Mengembalikan nama pabrikan.",
    },
    params: {},
  },
  {
    module: "Vehicle",
    function: "model",
    description: {
      "zh-CN": "返回车辆型号。",
      "zh-TW": "返回車輛型號。",
      en: "Returns a vehicle model.",
      ja: "車両モデルを返します。",
      id: "Mengembalikan model kendaraan.",
    },
    params: {},
  },
  {
    module: "Vehicle",
    function: "type",
    description: {
      "zh-CN": "返回车辆类型。",
      "zh-TW": "返回車輛類型。",
      en: "Returns a vehicle type.",
      ja: "車両の種類を返します。",
      id: "Mengembalikan jenis kendaraan.",
    },
    params: {},
  },
  {
    module: "Vehicle",
    function: "vehicle",
    description: {
      "zh-CN": "返回一辆随机车辆。",
      "zh-TW": "返回一輛隨機車輛。",
      en: "Returns a random vehicle.",
      ja: "ランダムな車両を返します。",
      id: "Mengembalikan kendaraan acak.",
    },
    params: {},
  },
  {
    module: "Vehicle",
    function: "vin",
    description: {
      "zh-CN": "返回车辆识别号码 (VIN)。",
      "zh-TW": "返回車輛識別號碼 (VIN)。",
      en: "Returns a vehicle identification number (VIN).",
      ja: "車両識別番号 (VIN) を返します。",
      id: "Mengembalikan nomor identifikasi kendaraan (VIN).",
    },
    params: {},
  },
  {
    module: "Vehicle",
    function: "vrm",
    description: {
      "zh-CN": "返回车辆注册号码 (车辆注册标记 - VRM)。",
      "zh-TW": "返回車輛註冊號碼 (車輛註冊標記 - VRM)。",
      en: "Returns a vehicle registration number (Vehicle Registration Mark - VRM).",
      ja: "車両登録番号 (車両登録マーク - VRM) を返します。",
      id: "Mengembalikan nomor registrasi kendaraan (Tanda Registrasi Kendaraan - VRM).",
    },
    params: {},
  },
  {
    module: "Word",
    function: "adjective",
    description: {
      "zh-CN": "返回一个随机或选定长度的形容词。",
      "zh-TW": "返回一個隨機或選定長度的形容詞。",
      en: "Returns an adjective of random or optionally specified length.",
      ja: "ランダムまたは任意の指定長さの形容詞を返します。",
      id: "Mengembalikan kata sifat dengan panjang acak atau panjang yang ditentukan.",
    },
    params: {
      length: {
        isrealKey: true,
        type: "number",
        default: "",
        description: {
          "zh-CN": "单词的预期长度。",
          "zh-TW": "字詞的預期長度。",
          en: "The expected length of the word.",
          ja: "単語の予想される長さ。",
          id: "Panjang yang diharapkan dari kata tersebut.",
        },
      },
      "length.min": {
        isrealKey: true,
        type: "number",
        default: "",
        description: {
          "zh-CN": "单词预期的最小长度。需要同时设置最大长度（max）才会生效。",
          "zh-TW": "字詞預期的最小長度。需要同時設定最大長度（max）才會生效。",
          en: "The expected minimum length of the word. It will only take effect when the expected maximum length (max) is set simultaneously.",
          ja: "単語の予想される最小長さ。予想される最大長さ（max）を同時に設定しなければ、効力を発揮しません。",
          id: "Panjang minimum yang diharapkan dari kata tersebut. Hanya akan berlaku jika panjang maksimum yang diharapkan (max) diatur secara bersamaan.",
        },
      },
      "length.max": {
        isrealKey: true,
        type: "number",
        default: "",
        description: {
          "zh-CN": "单词预期的最大长度。需要同时设置最小长度（min）才会生效。",
          "zh-TW": "字詞預期的最大長度。需要同時設定最小長度（min）才會生效。",
          en: "The expected maximum length of the word. It will only take effect when the expected minimum length (min) is set simultaneously.",
          ja: "単語の予想される最大長さ。予想される最小長さ（min）を同時に設定しなければ、効力を発揮しません。",
          id: "Panjang maksimum yang diharapkan dari kata tersebut. Hanya akan berlaku jika panjang minimum yang diharapkan (min) diatur secara bersamaan.",
        },
      },
      strategy: {
        isrealKey: true,
        type: "enum(fail | closest | shortest | longest | any-length)",
        default: "'any-length'",
        description: {
          "zh-CN": "当未找到长度匹配的单词时要采用的策略。",
          "zh-TW": "當未找到長度匹配的字詞時要採用的策略。",
          en: "The strategy to apply when no words with a matching length are found.",
          ja: "長さが一致する単語が見つからない場合に適用する戦略。",
          id: "Strategi yang akan diterapkan jika tidak ada kata dengan panjang yang sesuai ditemukan.",
        },
      },
    },
  },
  {
    module: "Word",
    function: "adverb",
    description: {
      "zh-CN": "返回一个随机或选定长度的副词。",
      "zh-TW": "返回一個隨機或選定長度的副詞。",
      en: "Returns an adverb of random or optionally specified length.",
      ja: "ランダムまたは任意の指定長さの副詞を返します。",
      id: "Mengembalikan kata keterangan dengan panjang acak atau panjang yang ditentukan.",
    },
    params: {
      length: {
        isrealKey: true,
        type: "number",
        default: "",
        description: {
          "zh-CN": "单词的预期长度。",
          "zh-TW": "字詞的預期長度。",
          en: "The expected length of the word.",
          ja: "単語の予想される長さ。",
          id: "Panjang yang diharapkan dari kata tersebut.",
        },
      },
      "length.min": {
        isrealKey: true,
        type: "number",
        default: "",
        description: {
          "zh-CN": "单词预期的最小长度。需要同时设置最大长度（max）才会生效。",
          "zh-TW": "字詞預期的最小長度。需要同時設定最大長度（max）才會生效。",
          en: "The expected minimum length of the word. It will only take effect when the expected maximum length (max) is set simultaneously.",
          ja: "単語の予想される最小長さ。予想される最大長さ（max）を同時に設定しなければ、効力を発揮しません。",
          id: "Panjang minimum yang diharapkan dari kata tersebut. Hanya akan berlaku jika panjang maksimum yang diharapkan (max) diatur secara bersamaan.",
        },
      },
      "length.max": {
        isrealKey: true,
        type: "number",
        default: "",
        description: {
          "zh-CN": "单词预期的最大长度。需要同时设置最小长度（min）才会生效。",
          "zh-TW": "字詞預期的最大長度。需要同時設定最小長度（min）才會生效。",
          en: "The expected maximum length of the word. It will only take effect when the expected minimum length (min) is set simultaneously.",
          ja: "単語の予想される最大長さ。予想される最小長さ（min）を同時に設定しなければ、効力を発揮しません。",
          id: "Panjang maksimum yang diharapkan dari kata tersebut. Hanya akan berlaku jika panjang minimum yang diharapkan (min) diatur secara bersamaan.",
        },
      },
      strategy: {
        isrealKey: true,
        type: "enum(fail | closest | shortest | longest | any-length)",
        default: "'any-length'",
        description: {
          "zh-CN": "当未找到长度匹配的单词时要采用的策略。",
          "zh-TW": "當未找到長度匹配的字詞時要採用的策略。",
          en: "The strategy to apply when no words with a matching length are found.",
          ja: "長さが一致する単語が見つからない場合に適用する戦略。",
          id: "Strategi yang akan diterapkan jika tidak ada kata dengan panjang yang sesuai ditemukan.",
        },
      },
    },
  },
  {
    module: "Word",
    function: "conjunction",
    description: {
      "zh-CN": "返回一个随机或选定长度的连词。",
      "zh-TW": "返回一個隨機或選定長度的連詞。",
      en: "Returns a conjunction of random or optionally specified length.",
      ja: "ランダムまたは任意の指定長さの接続詞を返します。",
      id: "Mengembalikan kata sambung dengan panjang acak atau panjang yang ditentukan.",
    },
    params: {
      length: {
        isrealKey: true,
        type: "number",
        default: "",
        description: {
          "zh-CN": "单词的预期长度。",
          "zh-TW": "字詞的預期長度。",
          en: "The expected length of the word.",
          ja: "単語の予想される長さ。",
          id: "Panjang yang diharapkan dari kata tersebut.",
        },
      },
      "length.min": {
        isrealKey: true,
        type: "number",
        default: "",
        description: {
          "zh-CN": "单词预期的最小长度。需要同时设置最大长度（max）才会生效。",
          "zh-TW": "字詞預期的最小長度。需要同時設定最大長度（max）才會生效。",
          en: "The expected minimum length of the word. It will only take effect when the expected maximum length (max) is set simultaneously.",
          ja: "単語の予想される最小長さ。予想される最大長さ（max）を同時に設定しなければ、効力を発揮しません。",
          id: "Panjang minimum yang diharapkan dari kata tersebut. Hanya akan berlaku jika panjang maksimum yang diharapkan (max) diatur secara bersamaan.",
        },
      },
      "length.max": {
        isrealKey: true,
        type: "number",
        default: "",
        description: {
          "zh-CN": "单词预期的最大长度。需要同时设置最小长度（min）才会生效。",
          "zh-TW": "字詞預期的最大長度。需要同時設定最小長度（min）才會生效。",
          en: "The expected maximum length of the word. It will only take effect when the expected minimum length (min) is set simultaneously.",
          ja: "単語の予想される最大長さ。予想される最小長さ（min）を同時に設定しなければ、効力を発揮しません。",
          id: "Panjang maksimum yang diharapkan dari kata tersebut. Hanya akan berlaku jika panjang minimum yang diharapkan (min) diatur secara bersamaan.",
        },
      },
      strategy: {
        isrealKey: true,
        type: "enum(fail | closest | shortest | longest | any-length)",
        default: "'any-length'",
        description: {
          "zh-CN": "当未找到长度匹配的单词时要采用的策略。",
          "zh-TW": "當未找到長度匹配的字詞時要採用的策略。",
          en: "The strategy to apply when no words with a matching length are found.",
          ja: "長さが一致する単語が見つからない場合に適用する戦略。",
          id: "Strategi yang akan diterapkan jika tidak ada kata dengan panjang yang sesuai ditemukan.",
        },
      },
    },
  },
  {
    module: "Word",
    function: "interjection",
    description: {
      "zh-CN": "返回一个随机或选定长度的感叹词。",
      "zh-TW": "返回一個隨機或選定長度的感嘆詞。",
      en: "Returns an interjection of random or optionally specified length.",
      ja: "ランダムまたは任意の指定長さの感嘆詞を返します。",
      id: "Mengembalikan interjeksi dengan panjang acak atau panjang yang ditentukan.",
    },
    params: {
      length: {
        isrealKey: true,
        type: "number",
        default: "",
        description: {
          "zh-CN": "单词的预期长度。",
          "zh-TW": "字詞的預期長度。",
          en: "The expected length of the word.",
          ja: "単語の予想される長さ。",
          id: "Panjang yang diharapkan dari kata tersebut.",
        },
      },
      "length.min": {
        isrealKey: true,
        type: "number",
        default: "",
        description: {
          "zh-CN": "单词预期的最小长度。需要同时设置最大长度（max）才会生效。",
          "zh-TW": "字詞預期的最小長度。需要同時設定最大長度（max）才會生效。",
          en: "The expected minimum length of the word. It will only take effect when the expected maximum length (max) is set simultaneously.",
          ja: "単語の予想される最小長さ。予想される最大長さ（max）を同時に設定しなければ、効力を発揮しません。",
          id: "Panjang minimum yang diharapkan dari kata tersebut. Hanya akan berlaku jika panjang maksimum yang diharapkan (max) diatur secara bersamaan.",
        },
      },
      "length.max": {
        isrealKey: true,
        type: "number",
        default: "",
        description: {
          "zh-CN": "单词预期的最大长度。需要同时设置最小长度（min）才会生效。",
          "zh-TW": "字詞預期的最大長度。需要同時設定最小長度（min）才會生效。",
          en: "The expected maximum length of the word. It will only take effect when the expected minimum length (min) is set simultaneously.",
          ja: "単語の予想される最大長さ。予想される最小長さ（min）を同時に設定しなければ、効力を発揮しません。",
          id: "Panjang maksimum yang diharapkan dari kata tersebut. Hanya akan berlaku jika panjang minimum yang diharapkan (min) diatur secara bersamaan.",
        },
      },
      strategy: {
        type: "enum(fail | closest | shortest | longest | any-length)",
        default: "'any-length'",
        description: {
          "zh-CN": "当未找到长度匹配的单词时要采用的策略。",
          "zh-TW": "當未找到長度匹配的字詞時要採用的策略。",
          en: "The strategy to apply when no words with a matching length are found.",
          ja: "長さが一致する単語が見つからない場合に適用する戦略。",
          id: "Strategi yang akan diterapkan jika tidak ada kata dengan panjang yang sesuai ditemukan.",
        },
      },
    },
  },
  {
    module: "Word",
    function: "noun",
    description: {
      "zh-CN": "返回一个随机或选定长度的名词。",
      "zh-TW": "返回一個隨機或選定長度的名詞。",
      en: "Returns a noun of random or optionally specified length.",
      ja: "ランダムまたは任意の指定長さの名詞を返します。",
      id: "Mengembalikan kata benda dengan panjang acak atau panjang yang ditentukan.",
    },
    params: {
      length: {
        isrealKey: true,
        type: "number",
        default: "",
        description: {
          "zh-CN": "单词的预期长度。",
          "zh-TW": "字詞的預期長度。",
          en: "The expected length of the word.",
          ja: "単語の予想される長さ。",
          id: "Panjang yang diharapkan dari kata tersebut.",
        },
      },
      "length.min": {
        isrealKey: true,
        type: "number",
        default: "",
        description: {
          "zh-CN": "单词预期的最小长度。需要同时设置最大长度（max）才会生效。",
          "zh-TW": "字詞預期的最小長度。需要同時設定最大長度（max）才會生效。",
          en: "The expected minimum length of the word. It will only take effect when the expected maximum length (max) is set simultaneously.",
          ja: "単語の予想される最小長さ。予想される最大長さ（max）を同時に設定しなければ、効力を発揮しません。",
          id: "Panjang minimum yang diharapkan dari kata tersebut. Hanya akan berlaku jika panjang maksimum yang diharapkan (max) diatur secara bersamaan.",
        },
      },
      "length.max": {
        isrealKey: true,
        type: "number",
        default: "",
        description: {
          "zh-CN": "单词预期的最大长度。需要同时设置最小长度（min）才会生效。",
          "zh-TW": "字詞預期的最大長度。需要同時設定最小長度（min）才會生效。",
          en: "The expected maximum length of the word. It will only take effect when the expected minimum length (min) is set simultaneously.",
          ja: "単語の予想される最大長さ。予想される最小長さ（min）を同時に設定しなければ、効力を発揮しません。",
          id: "Panjang maksimum yang diharapkan dari kata tersebut. Hanya akan berlaku jika panjang minimum yang diharapkan (min) diatur secara bersamaan.",
        },
      },
      strategy: {
        isrealKey: true,
        type: "enum(fail | closest | shortest | longest | any-length)",
        default: "'any-length'",
        description: {
          "zh-CN": "当未找到长度匹配的单词时要采用的策略。",
          "zh-TW": "當未找到長度匹配的字詞時要採用的策略。",
          en: "The strategy to apply when no words with a matching length are found.",
          ja: "長さが一致する単語が見つからない場合に適用する戦略。",
          id: "Strategi yang akan diterapkan jika tidak ada kata dengan panjang yang sesuai ditemukan.",
        },
      },
    },
  },
  {
    module: "Word",
    function: "preposition",
    description: {
      "zh-CN": "返回一个随机或选定长度的介词。",
      "zh-TW": "返回一個隨機或選定長度的介詞。",
      en: "Returns a preposition of random or optionally specified length.",
      ja: "ランダムまたは任意の指定長さの前置詞を返します。",
      id: "Mengembalikan preposisi dengan panjang acak atau panjang yang ditentukan.",
    },
    params: {
      length: {
        isrealKey: true,
        type: "number",
        default: "",
        description: {
          "zh-CN": "单词的预期长度。",
          "zh-TW": "字詞的預期長度。",
          en: "The expected length of the word.",
          ja: "単語の予想される長さ。",
          id: "Panjang yang diharapkan dari kata tersebut.",
        },
      },
      "length.min": {
        isrealKey: true,
        type: "number",
        default: "",
        description: {
          "zh-CN": "单词预期的最小长度。需要同时设置最大长度（max）才会生效。",
          "zh-TW": "字詞預期的最小長度。需要同時設定最大長度（max）才會生效。",
          en: "The expected minimum length of the word. It will only take effect when the expected maximum length (max) is set simultaneously.",
          ja: "単語の予想される最小長さ。予想される最大長さ（max）を同時に設定しなければ、効力を発揮しません。",
          id: "Panjang minimum yang diharapkan dari kata tersebut. Hanya akan berlaku jika panjang maksimum yang diharapkan (max) diatur secara bersamaan.",
        },
      },
      "length.max": {
        isrealKey: true,
        type: "number",
        default: "",
        description: {
          "zh-CN": "单词预期的最大长度。需要同时设置最小长度（min）才会生效。",
          "zh-TW": "字詞預期的最大長度。需要同時設定最小長度（min）才會生效。",
          en: "The expected maximum length of the word. It will only take effect when the expected minimum length (min) is set simultaneously.",
          ja: "単語の予想される最大長さ。予想される最小長さ（min）を同時に設定しなければ、効力を発揮しません。",
          id: "Panjang maksimum yang diharapkan dari kata tersebut. Hanya akan berlaku jika panjang minimum yang diharapkan (min) diatur secara bersamaan.",
        },
      },
      strategy: {
        isrealKey: true,
        type: "enum(fail | closest | shortest | longest | any-length)",
        default: "'any-length'",
        description: {
          "zh-CN": "当未找到长度匹配的单词时要采用的策略。",
          "zh-TW": "當未找到長度匹配的字詞時要採用的策略。",
          en: "The strategy to apply when no words with a matching length are found.",
          ja: "長さが一致する単語が見つからない場合に適用する戦略。",
          id: "Strategi yang akan diterapkan jika tidak ada kata dengan panjang yang sesuai ditemukan.",
        },
      },
    },
  },
  {
    module: "Word",
    function: "sample",
    description: {
      "zh-CN": "返回一个包含随机或选定长度的随机样本。",
      "zh-TW": "返回一個包含隨機或選定長度的隨機樣本。",
      en: "Returns a random sample of random or optionally specified length.",
      ja: "ランダムまたは任意の指定長さのランダムサンプルを返します。",
      id: "Mengembalikan sampel acak dengan panjang acak atau panjang yang ditentukan.",
    },
    params: {
      length: {
        isrealKey: true,
        type: "number",
        default: "",
        description: {
          "zh-CN": "单词的预期长度。",
          "zh-TW": "字詞的預期長度。",
          en: "The expected length of the word.",
          ja: "単語の予想される長さ。",
          id: "Panjang yang diharapkan dari kata tersebut.",
        },
      },
      "length.min": {
        isrealKey: true,
        type: "number",
        default: "",
        description: {
          "zh-CN": "单词预期的最小长度。需要同时设置最大长度（max）才会生效。",
          "zh-TW": "字詞預期的最小長度。需要同時設定最大長度（max）才會生效。",
          en: "The expected minimum length of the word. It will only take effect when the expected maximum length (max) is set simultaneously.",
          ja: "単語の予想される最小長さ。予想される最大長さ（max）を同時に設定しなければ、効力を発揮しません。",
          id: "Panjang minimum yang diharapkan dari kata tersebut. Hanya akan berlaku jika panjang maksimum yang diharapkan (max) diatur secara bersamaan.",
        },
      },
      "length.max": {
        isrealKey: true,
        type: "number",
        default: "",
        description: {
          "zh-CN": "单词预期的最大长度。需要同时设置最小长度（min）才会生效。",
          "zh-TW": "字詞預期的最大長度。需要同時設定最小長度（min）才會生效。",
          en: "The expected maximum length of the word. It will only take effect when the expected minimum length (min) is set simultaneously.",
          ja: "単語の予想される最大長さ。予想される最小長さ（min）を同時に設定しなければ、効力を発揮しません。",
          id: "Panjang maksimum yang diharapkan dari kata tersebut. Hanya akan berlaku jika panjang minimum yang diharapkan (min) diatur secara bersamaan.",
        },
      },
      strategy: {
        isrealKey: true,
        type: "enum(fail | closest | shortest | longest | any-length)",
        default: "'any-length'",
        description: {
          "zh-CN": "当未找到长度匹配的单词时要采用的策略。",
          "zh-TW": "當未找到長度匹配的字詞時要採用的策略。",
          en: "The strategy to apply when no words with a matching length are found.",
          ja: "長さが一致する単語が見つからない場合に適用する戦略。",
          id: "Strategi yang akan diterapkan jika tidak ada kata dengan panjang yang sesuai ditemukan.",
        },
      },
    },
  },
  {
    module: "Word",
    function: "verb",
    description: {
      "zh-CN": "返回一个随机或选定长度的动词。",
      "zh-TW": "返回一個隨機或選定長度的動詞。",
      en: "Returns a verb of random or optionally specified length.",
      ja: "ランダムまたは任意の指定長さの動詞を返します。",
      id: "Mengembalikan kata kerja dengan panjang acak atau panjang yang ditentukan.",
    },
    params: {
      length: {
        isrealKey: true,
        type: "number",
        default: "",
        description: {
          "zh-CN": "单词的预期长度。",
          "zh-TW": "字詞的預期長度。",
          en: "The expected length of the word.",
          ja: "単語の予想される長さ。",
          id: "Panjang yang diharapkan dari kata tersebut.",
        },
      },
      "length.min": {
        isrealKey: true,
        type: "number",
        default: "",
        description: {
          "zh-CN": "单词预期的最小长度。需要同时设置最大长度（max）才会生效。",
          "zh-TW": "字詞預期的最小長度。需要同時設定最大長度（max）才會生效。",
          en: "The expected minimum length of the word. It will only take effect when the expected maximum length (max) is set simultaneously.",
          ja: "単語の予想される最小長さ。予想される最大長さ（max）を同時に設定しなければ、効力を発揮しません。",
          id: "Panjang minimum yang diharapkan dari kata tersebut. Hanya akan berlaku jika panjang maksimum yang diharapkan (max) diatur secara bersamaan.",
        },
      },
      "length.max": {
        isrealKey: true,
        type: "number",
        default: "",
        description: {
          "zh-CN": "单词预期的最大长度。需要同时设置最小长度（min）才会生效。",
          "zh-TW": "字詞預期的最大長度。需要同時設定最小長度（min）才會生效。",
          en: "The expected maximum length of the word. It will only take effect when the expected minimum length (min) is set simultaneously.",
          ja: "単語の予想される最大長さ。予想される最小長さ（min）を同時に設定しなければ、効力を発揮しません。",
          id: "Panjang maksimum yang diharapkan dari kata tersebut. Hanya akan berlaku jika panjang minimum yang diharapkan (min) diatur secara bersamaan.",
        },
      },
      strategy: {
        isrealKey: true,
        type: "enum(fail | closest | shortest | longest | any-length)",
        default: "'any-length'",
        description: {
          "zh-CN": "当未找到长度匹配的单词时要采用的策略。",
          "zh-TW": "當未找到長度匹配的字詞時要採用的策略。",
          en: "The strategy to apply when no words with a matching length are found.",
          ja: "長さが一致する単語が見つからない場合に適用する戦略。",
          id: "Strategi yang akan diterapkan jika tidak ada kata dengan panjang yang sesuai ditemukan.",
        },
      },
    },
  },
  {
    module: "Word",
    function: "words",
    description: {
      "zh-CN": "返回一个包含多个空格分隔随机单词的字符串。",
      "zh-TW": "返回一個包含多個空格分隔隨機單詞的字符串。",
      en: "Returns a string containing a number of space separated random words.",
      ja: "スペースで区切られたランダムな単語の数を含む文字列を返します。",
      id: "Mengembalikan string yang berisi sejumlah kata acak yang dipisahkan oleh spasi.",
    },
    params: {
      count: {
        isrealKey: true,
        type: "number",
        default: "{ min: 1, max: 3 }",
        description: {
          "zh-CN": "要返回的单词数量。",
          "zh-TW": "要回傳的字詞數量。",
          en: "The number of words to return.",
          ja: "返す単語の数。",
          id: "Jumlah kata yang akan dikembalikan.",
        },
      },
      "count.min": {
        isrealKey: true,
        type: "number",
        default: "1",
        description: {
          "zh-CN":
            "要返回的单词的最小数量，需要同时设置最大数量（max）才会生效。",
          "zh-TW":
            "要回傳的字詞的最小數量，需要同時設定最大數量（max）才會生效。",
          en: "The minimum number of words to return. It will only take effect when the maximum number (max) is set simultaneously.",
          ja: "返す単語の最小数。最大数（max）を同時に設定しなければ、効力を発揮しません。",
          id: "Jumlah minimum kata yang akan dikembalikan. Hanya akan berlaku jika jumlah maksimum (max) diatur secara bersamaan.",
        },
      },
      "count.max": {
        isrealKey: true,
        type: "number",
        default: "3",
        description: {
          "zh-CN":
            "要返回的单词的最大数量，需要同时设置最小数量（min）才会生效。",
          "zh-TW":
            "要回傳的字詞的最大數量，需要同時設定最小數量（min）才會生效。",
          en: "The maximum number of words to return. It will only take effect when the minimum number of words (min) is set simultaneously.",
          ja: "返す単語の最大数。返す単語の最小数（min）を同時に設定しなければ、効力を発揮しません。",
          id: "Jumlah maksimum kata yang akan dikembalikan. Hanya akan berlaku jika jumlah minimum kata (min) diatur secara bersamaan.",
        },
      },
    },
  },
];
