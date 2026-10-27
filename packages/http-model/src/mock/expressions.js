/** Expression grammar adapted from exp-mock (MIT, Copyright 2024 Onapi Team). See LICENSE.txt. */
import _ from "lodash";
import JSON5 from "json5";
import * as Base64 from "js-base64";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc.js";
import advancedFormat from "dayjs/plugin/advancedFormat.js";
import {
  MD5,
  SHA1,
  SHA224,
  SHA256,
  SHA384,
  SHA512,
} from "@onapi/http-model/mock/hashes";
import { generateIdCard, generateBankCard } from "@onapi/http-model/mock/cards";
import * as fakerLocales from "@onapi/http-model/mock/locales";
import fakerDefinitions from "@onapi/http-model/mock/faker-definitions.json";
const fakerObject = fakerDefinitions.filter(
  (item) => !["idcard", "bankcard"].includes(item.function),
);
const fakerCustomObject = fakerDefinitions.filter((item) =>
  ["idcard", "bankcard"].includes(item.function),
);
const baseEncodeFunctions = {
    md5: (a) => String(MD5(a)),
    sha1: (a) => String(SHA1(a)),
    sha224: (a) => String(SHA224(a)),
    sha256: (a) => String(SHA256(a)),
    sha384: (a) => String(SHA384(a)),
    sha512: (a) => String(SHA512(a)),
    lower: _.toLower,
    length: _.size,
    substr: (a, e, n) => String(a).substr(e, n),
    base64: Base64.encode,
    unbase64: Base64.decode,
    encodeuricomponent: encodeURIComponent,
    decodeuricomponent: decodeURIComponent,
    concat: (a, e) => String(a).concat(String(e)),
    lconcat: (a, e) => String(e).concat(String(a)),
    upper: _.toUpper,
    number: _.toNumber,
    padstart: _.padStart,
    padend: _.padEnd,
  },
  encodeMap = { ",": "%2C", "\n": "%0A" },
  encryptString = (a) =>
    a.replace(
      new RegExp(Object.keys(encodeMap).join("|"), "g"),
      (a2) => encodeMap[a2],
    ),
  decryptString = (a) =>
    a.replace(
      new RegExp(Object.keys(_.invert(encodeMap)).join("|"), "g"),
      (a2) => _.invert(encodeMap)[a2],
    ),
  getFakerObject = () => _.concat(fakerCustomObject, fakerObject),
  parseParams = (a) =>
    _.fromPairs(
      a.split(",").map((a2) => {
        let [e, n] = a2.split("=");
        if (((e = _.trim(e)), (n = String(n)), !_.isEmpty(e))) {
          return [e, decryptString(n)];
        }
      }),
    ),
  parseStringToArray = (a) => {
    if ("string" !== typeof a) {
      throw new Error("Input must be a string");
    }
    const e = a.match(/^\[\s*([^\]]*?)\s*\]$/);
    if (!e) {
      throw new Error(
        "Format does not match, should be [element1, element2, ...]",
      );
    }
    const n = e[1];
    if (!n) {
      throw new Error("empty");
    }
    return _.filter(_.map(n.split(","), _.trim), Boolean);
  },
  parseExp = (exp, environments, lang = "en", customFunc) => {
    const encodeFunctions = { ...baseEncodeFunctions };
    let faker;
    switch (
      (_.isObject(customFunc) &&
        !_.isEmpty(customFunc) &&
        _.forEach(customFunc, (a, e) => {
          ((e = _.trim(e)),
            _.startsWith(e, "fn_") &&
              !_.isEmpty(_.trimStart(e, "fn_")) &&
              _.set(
                encodeFunctions,
                _.toLower(e),
                new Function("text", String(a)),
              ));
        }),
      _.toLower(lang))
    ) {
      case "zh-cn":
      case "zh-hans":
        ({ fakerZH_CN: faker } = fakerLocales);
        break;
      default:
        faker = fakerLocales.faker;
    }
    ((faker.string.idcard = generateIdCard.bind(faker.string)),
      (faker.string.bankcard = generateBankCard.bind(faker.string)),
      _.startsWith(exp, "{{") &&
        _.endsWith(exp, "}}") &&
        (exp = _.trim(exp, "{}")));
    const expObj = _.split(exp, "|");
    let distData = _.first(expObj),
      dist = { type: "", expression: "", value: "" };
    const functions = [];
    if (_.startsWith(distData, "$fakerjs.")) {
      const fakerMatches = distData.match(
          /\$fakerjs\.(\w+)\.(\w+)\(?(.*?)\)?$/,
        ),
        fakerFunctionObj = _.find(
          getFakerObject(),
          (a) =>
            _.toLower(fakerMatches[1]) === _.toLower(a?.module) &&
            _.toLower(fakerMatches[2]) === _.toLower(a?.function),
        );
      if (_.isEmpty(fakerFunctionObj)) {
        dist = {
          type: "fixed",
          expression: `{{${distData}}}`,
          value: `{{${distData}}}`,
        };
      } else {
        let inParas = {},
          fakerModule = fakerFunctionObj?.module,
          fakerFunc = fakerFunctionObj?.function,
          fakerParas = {},
          frontParas = {},
          isrealKey = {};
        _.isString(fakerFunctionObj?.suffix) &&
          (fakerFunc = _.join(
            _.slice(fakerFunc, 0, 0 - _.size(fakerFunctionObj?.suffix)),
            "",
          ));
        try {
          inParas = parseParams(
            String(fakerMatches[3]),
            _.keys(fakerFunctionObj?.params),
          );
        } catch (a) {}
        let tmpParas = _.cloneDeep(inParas);
        if (
          (_.isEmpty(tmpParas) ||
            _.isEmpty(fakerFunctionObj?.params) ||
            _.forEach(_.keys(tmpParas), (key) => {
              const keyName = _.find(_.keys(fakerFunctionObj?.params), (a) =>
                _.endsWith(_.toLower(a), _.toLower(key)),
              );
              if (keyName) {
                let paraSetting = _.get(fakerFunctionObj?.params, `${keyName}`),
                  frontValue = tmpParas[key];
                switch (_.first(_.split(_.toLower(paraSetting?.type), "("))) {
                  case "enums":
                  case "array":
                    try {
                      frontValue = JSON5.parse(frontValue);
                    } catch (a) {
                      try {
                        frontValue = parseStringToArray(frontValue);
                      } catch (a2) {}
                    }
                    break;
                  case "bigint":
                  case "integer":
                  case "float":
                  case "number":
                    frontValue = _.toNumber(frontValue);
                }
                frontParas[keyName] = frontValue;
                let paraVal =
                  !_.isEmpty(tmpParas[key]) ||
                  (_.isNumber(tmpParas[key]) && 0 !== _.isNumber(tmpParas[key]))
                    ? tmpParas[key]
                    : String(_.get(paraSetting, "default"));
                switch (_.toLower(paraSetting?.type)) {
                  case "object":
                  case "array":
                  case "coordinate":
                    if (_.isString(paraVal)) {
                      try {
                        paraVal = _.map(JSON5.parse(paraVal), (a) => {
                          if (!_.isString(a)) {
                            return JSON.stringify(a);
                          }
                        });
                      } catch (a) {
                        try {
                          paraVal = parseStringToArray(paraVal);
                        } catch (a2) {
                          paraVal = {};
                        }
                      }
                    }
                    break;
                  case "string":
                    (_.isObject(paraVal) &&
                      (paraVal = _.join(_.values(paraVal), ",")),
                      (paraVal = String(paraVal)));
                    break;
                  case "boolean":
                    paraVal = "true" === paraVal;
                    break;
                  case "integer":
                  case "float":
                  case "number":
                    paraVal = _.toNumber(paraVal);
                    break;
                  case "bigint":
                    ((paraVal = String(paraVal)),
                      _.endsWith(paraVal, "n") &&
                        (paraVal = _.trimEnd(paraVal, "n")),
                      (paraVal = BigInt(paraVal)));
                    break;
                  case "function":
                    const tmpStr = String(paraVal);
                    if (_.startsWith(paraSetting?.default, "faker.")) {
                      const tmpFunc = `() => ${tmpStr}`;
                      try {
                        paraVal = new Function("faker", `return ${tmpFunc}`)(
                          faker,
                        );
                      } catch (a) {
                        paraVal = () => {};
                      }
                    } else {
                      paraVal = () => tmpStr;
                    }
                    break;
                  case "regexp":
                    try {
                      paraVal = new RegExp(_.trim(paraVal, "/"));
                    } catch (a) {}
                    break;
                  case "enum":
                  case "enums":
                    if (!_.isObject(paraVal)) {
                      try {
                        paraVal = JSON5.parse(paraVal);
                      } catch (a) {
                        try {
                          paraVal = JSON5.parse(
                            _.get(paraSetting, "default") || "{}",
                          );
                        } catch (a2) {
                          paraVal = {};
                        }
                      }
                    }
                    break;
                  default:
                    if (
                      (_.startsWith(paraSetting?.type, "enum(") ||
                        _.startsWith(paraSetting?.type, "enums(")) &&
                      _.endsWith(paraSetting?.type, ")")
                    ) {
                      const a = String(paraSetting?.type).match(/\(([^)]+)\)/);
                      if (a) {
                        const e = _.map(_.split(a[1], "|"), _.trim);
                        try {
                          paraVal = parseStringToArray(paraVal);
                        } catch (a2) {}
                        paraVal = _.isString(paraVal)
                          ? e.indexOf(paraVal) > -1
                            ? paraVal
                            : _.first(e)
                          : _.isArray(paraVal) && _.intersection(e, paraVal)
                            ? _.intersection(e, paraVal)
                            : _.first(e);
                      }
                    }
                }
                if (_.toLower(key) === _.toLower(keyName)) {
                  paraSetting?.isrealKey
                    ? (_.set(isrealKey, keyName, paraVal),
                      _.set(fakerParas, "isrealKey", isrealKey))
                    : (_.isEmpty(fakerParas)
                        ? (fakerParas = [])
                        : _.isPlainObject(fakerParas) &&
                          (fakerParas = [fakerParas]),
                      fakerParas.push(paraVal));
                } else {
                  const a = _.split(keyName, ".");
                  _.toLower(_.last(a)) === _.toLower(key) &&
                    (paraSetting?.isrealKey
                      ? (_.set(isrealKey, keyName, paraVal),
                        _.set(fakerParas, "isrealKey", isrealKey))
                      : (_.isEmpty(fakerParas)
                          ? (fakerParas = [])
                          : _.isPlainObject(fakerParas) &&
                            (fakerParas = [fakerParas]),
                        fakerParas.push(paraVal)));
                }
              }
            }),
          _.isFunction(faker[_.toLower(fakerModule)][fakerFunc]))
        ) {
          try {
            const a = _.findKey(
              fakerParas,
              (a2) => _.isObject(a2) && _.keys(a2).indexOf("isrealKey") > -1,
            );
            if (
              _.isArray(fakerParas) &&
              ((2 === _.size(fakerParas) &&
                _.isArray(_.first(fakerParas)) &&
                _.isInteger(_.last(fakerParas))) ||
                (!_.isUndefined(a) && _.size(fakerParas) > 1) ||
                _.size(fakerParas) !== _.size(_.keys(fakerParas)))
            ) {
              _.isUndefined(a) || (fakerParas[a] = fakerParas[a]?.isrealKey);
              let e = _.invoke(
                faker[_.toLower(fakerModule)],
                fakerFunc,
                ..._.values(fakerParas),
              );
              (_.isString(fakerFunctionObj?.suffix) &&
                _.isObject(e) &&
                (e = _.get(e, fakerFunctionObj?.suffix)),
                "bigint" === typeof e && (e = `${String(e)}n`),
                (dist = {
                  type: "fakerjs",
                  expression: {
                    module: fakerModule,
                    function: fakerFunc,
                    paras: frontParas,
                    finalParas: _.map(_.values(fakerParas), (a2) =>
                      _.isFunction(a2) ? String(a2) : a2,
                    ),
                  },
                  value: e,
                }));
            } else {
              fakerParas =
                _.isArray(fakerParas) && _.isUndefined(fakerParas?.isrealKey)
                  ? _.first(fakerParas)
                  : fakerParas?.isrealKey;
              let a2 = _.invoke(
                faker[_.toLower(fakerModule)],
                fakerFunc,
                fakerParas,
              );
              (_.isString(fakerFunctionObj?.suffix) &&
                _.isObject(a2) &&
                (a2 = _.get(a2, fakerFunctionObj?.suffix)),
                "bigint" === typeof a2 && (a2 = `${String(a2)}n`),
                (dist = {
                  type: "fakerjs",
                  expression: {
                    module: fakerModule,
                    function: `${fakerFunc}${_.isString(fakerFunctionObj?.suffix) ? _.upperFirst(fakerFunctionObj?.suffix) : ""}`,
                    paras: frontParas,
                    finalParas: fakerParas,
                  },
                  value: a2,
                }));
            }
          } catch (a) {
            dist = {
              type: "fixed",
              expression: `{{${distData}}}`,
              value: `{{${distData}}}`,
            };
          }
        } else {
          dist = {
            type: "fixed",
            expression: `{{${distData}}}`,
            value: `{{${distData}}}`,
          };
        }
      }
    } else if (_.startsWith(distData, "$function.fn_")) {
      const a = /\$function\.fn_([a-zA-Z0-9_]+)\(([^)]*)\)/,
        e = distData.match(a);
      if (
        e &&
        _.isString(e[1]) &&
        _.isString(e[2]) &&
        _.has(encodeFunctions, `fn_${_.toLower(_.trim(e[1]))}`)
      ) {
        try {
          const a2 = _.get(encodeFunctions, `fn_${_.toLower(_.trim(e[1]))}`),
            n = e[2];
          dist = {
            type: "function",
            expression: `fn_${_.trim(e[1])}(${n})`,
            value: a2(n),
          };
        } catch (a2) {
          dist = {
            type: "fixed",
            expression: `{{${distData}}}`,
            value: `{{${distData}}}`,
          };
        }
      } else {
        dist = {
          type: "fixed",
          expression: `{{${distData}}}`,
          value: `{{${distData}}}`,
        };
      }
    } else if (
      (_.startsWith(distData, '"') && _.endsWith(distData, '"')) ||
      (_.startsWith(distData, "'") && _.endsWith(distData, "'"))
    ) {
      dist = {
        type: "fixed",
        expression: _.trim(distData, `'"`),
        value: _.trim(distData, `'"`),
      };
    } else {
      let a = "";
      if (_.isUndefined(_.get(environments, distData))) {
        const e = _.first(_.split(distData, "|"));
        a = _.get(environments, e);
        _.isUndefined(a) && (a = `{{${distData}}}`);
      } else {
        a = _.get(environments, distData);
      }
      dist = { type: "variable", expression: String(distData), value: a };
    }
    _.isEmpty(_.slice(expObj, 1)) ||
      _.forEach(_.slice(expObj, 1), (a) => {
        if (_.isString(a)) {
          const e = a.match(/(\w+)\(?(.*?)\)?$/),
            n = _.trim(e[1]),
            i = _.isEmpty(_.trim(e[2])) ? [] : _.split(_.trim(e[2]), ",");
          if (
            ("format" !== n ||
              _.isFunction(encodeFunctions.format) ||
              (encodeFunctions.format = (a2, e2, n2) => {
                try {
                  const i2 = new Date(String(a2));
                  if (_.isNaN(i2.getTime())) {
                    return a2;
                  }
                  let t = i2.getTime();
                  const r = _.toInteger(_.first(_.split(n2, ":"))),
                    s = utc;
                  dayjs.extend(s);
                  const o = advancedFormat;
                  return (
                    dayjs.extend(o),
                    dayjs(t)
                      .utc()
                      .utcOffset(60 * r)
                      .format(e2)
                  );
                } catch (e3) {
                  return a2;
                }
              }),
            _.isFunction(encodeFunctions[_.toLower(n)]))
          ) {
            let a2 = _.get(dist, "value"),
              e2 = true;
            const t = {};
            try {
              switch (_.toLower(n)) {
                case "substr":
                  ((t.start = _.toInteger(i[0])),
                    (t.length = _.toInteger(i[1])),
                    (a2 = _.isArray(a2)
                      ? _.map(a2, (a3) =>
                          encodeFunctions[_.toLower(n)](a3, t.start, t.length),
                        )
                      : encodeFunctions[_.toLower(n)](a2, t.start, t.length)));
                  break;
                case "concat":
                case "lconcat":
                  ((t.text = _.toString(i[0])),
                    (a2 = _.isArray(a2)
                      ? _.map(a2, (a3) =>
                          encodeFunctions[_.toLower(n)](a3, t.text),
                        )
                      : encodeFunctions[_.toLower(n)](a2, t.text)));
                  break;
                case "padstart":
                case "padend":
                  ((t.length = _.toInteger(i[0])),
                    (t.text = _.toString(i[1] || "")),
                    (a2 = _.isArray(a2)
                      ? _.map(a2, (a3) =>
                          encodeFunctions[_.toLower(n)](a3, t.length, t.text),
                        )
                      : encodeFunctions[_.toLower(n)](a2, t.length, t.text)));
                  break;
                case "format":
                  ((t.format = _.toString(i[0] || "YYYY-MM-DD HH:mm:ss")),
                    (t.utc = _.toString(i[1] || "+00:00")),
                    (a2 = _.isArray(a2)
                      ? _.map(a2, (a3) =>
                          encodeFunctions[_.toLower(n)](a3, t.format, t.utc),
                        )
                      : encodeFunctions[_.toLower(n)](a2, t.format, t.utc)));
                  break;
                default:
                  a2 = _.isArray(a2)
                    ? _.map(
                        a2,
                        (e3) => (a2 = encodeFunctions[_.toLower(n)](e3)),
                      )
                    : encodeFunctions[_.toLower(n)](a2);
              }
            } catch (a3) {
              e2 = false;
            }
            (functions.push({
              function: n,
              paras: t,
              tmpValue: a2,
              isSuccess: e2,
            }),
              _.set(dist, "value", a2));
          }
        }
      });
    const parsedExp = { dist, functions };
    return parsedExp;
  },
  mockExp = (a, e, n = "en", i) =>
    _.startsWith(a, "{{") && _.endsWith(a, "}}")
      ? ((a = _.trim(a, "{}")), _.get(parseExp(a, e, n, i), "dist.value"))
      : a;
var stdin_default = mockExp;
export {
  decryptString,
  stdin_default as default,
  encryptString,
  getFakerObject,
  mockExp,
  parseExp,
};
