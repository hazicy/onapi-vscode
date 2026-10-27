import $RefParser from "@apidevtools/json-schema-ref-parser";
import { cloneDeep, isArray, isEmpty, isPlainObject, mapValues } from "lodash";
import { Parser } from "sql-ddl-to-json-schema";

export const cutLength = (schema: any) => {
  try {
    if (schema && schema?.definitions && !isEmpty(schema?.definitions)) {
      const definitions = mapValues(schema?.definitions, (v) => {
        if (v?.maxLength) {
          v["maxLength"] = 1024;
        }
        return v;
      });
      const newSchema = {
        ...cloneDeep(schema),
        definitions,
      };
      return newSchema;
    }
    return schema;
  } catch (err) {
    return schema;
  }
};

export const parseMySqlddlToSchema = async (sql: string) => {
  const parser = new Parser("mysql");
  let schemaDoc = null;
  try {
    schemaDoc = parser.feed(sql).toJsonSchemaArray({ useRef: true });
  } catch (ex) {
    return null;
  }
  if (!isArray(schemaDoc) || schemaDoc.length === 0) {
    return null;
  }
  try {
    const schemas = cutLength(schemaDoc[0]);
    const result = await $RefParser.dereference(schemas, {
      dereference: {
        circular: "ignore",
      },
    });
    if (!isPlainObject(result)) {
      return null;
    }
    delete result.$schema;
    if ("$comment" in result) {
      delete result.$comment;
    }
    delete result.$id;

    return result;
  } catch (err) {}
};
