import styles from "../HeaderAction.module.css";
import { memo, useState } from "react";
import { useTranslation } from "react-i18next";

import { Segmented, message } from "@/shared/ui/base";

import $RefParser from "@apidevtools/json-schema-ref-parser";
import { XMLParser } from "fast-xml-parser";
import { isObject, isPlainObject, isString } from "lodash-es";

import CodeEditor from "@/shared/components/CodeEditor/CodeEditor";
import Modal from "@/shared/ui/Modal";
import { recursionSetSchemaOrder } from "@/shared/events/export";
import { ThemeToken } from "@/shared/hooks/useTheme";
import { getSafeJSON } from "@/shared/utils/common";

import { SCHEMA_LANGUAGES, SCHEMA_TAB_LIST } from "../../constant";
import JSONToSchema from "../utils/json2Schema";
import { parseMySqlddlToSchema } from "../utils/sqldll2Schema";

interface ImportModalProps {
  onCancel: () => void;
  onChange: (value: unknown) => void;
  themeToken: ThemeToken;
}

const ImportModal = (props: ImportModalProps) => {
  const { onChange, onCancel, themeToken } = props;

  const [importValue, setImportValue] = useState("");
  const [activeKey, setActiveKey] = useState<
    "json" | "xml" | "jsonschema" | "mysqlddl"
  >("jsonschema");
  const { t } = useTranslation();
  const handleImport = async () => {
    let data: string | object = importValue;
    if (activeKey === "jsonschema") {
      const jsonData = getSafeJSON(importValue);
      if (!isObject(jsonData)) {
        message.error(t("supplement.invalid_data"));
        return;
      }
      data = await $RefParser.dereference(jsonData, {
        dereference: {
          circular: "ignore",
        },
      });
    } else if (activeKey === "json") {
      const rawData = getSafeJSON(importValue);
      if (!isObject(rawData)) {
        message.error(t("supplement.import_invalid_data"));
        return;
      }
      data = JSONToSchema(rawData);
    } else if (activeKey === "xml") {
      if (!isString(importValue)) {
        message.error(t("supplement.import_invalid_data"));
        return;
      }
      const parser = new XMLParser({ ignoreDeclaration: true });
      const xmlJsonData = parser.parse(importValue);
      data = JSONToSchema(xmlJsonData);
    } else if (activeKey === "mysqlddl") {
      (data as any) = await parseMySqlddlToSchema(importValue);
    }
    if (!isPlainObject(data)) {
      message.error(t("supplement.invalid_data"));
      return;
    }
    onChange(recursionSetSchemaOrder(data));
    onCancel();
  };

  return (
    <Modal
      width={880}
      open
      title={t("common.schema.import_modal.title")}
      onOk={handleImport}
      onCancel={onCancel}
    >
      <div className={styles.import}>
        <div className={styles.importHeader}>
          <Segmented
            value={activeKey}
            onChange={(activeKey: any) => setActiveKey(activeKey)}
            options={SCHEMA_TAB_LIST}
            className={styles.segmented}
            itemClassName={styles.segmentedItem}
          />
        </div>
        <div>
          <CodeEditor
            height={400}
            value={importValue}
            language={SCHEMA_LANGUAGES[activeKey]}
            onChange={(val: string) => {
              setImportValue(val);
            }}
          />
        </div>
      </div>
    </Modal>
  );
};

export default memo(ImportModal);
