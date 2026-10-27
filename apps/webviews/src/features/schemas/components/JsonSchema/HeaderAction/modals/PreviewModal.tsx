import styles from "../HeaderAction.module.css";
import React, { memo, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { message } from "@/shared/ui/base";

import { useMemoizedFn } from "ahooks";
import { cloneDeep, isObject } from "lodash-es";

import CodeEditor from "@/shared/components/CodeEditor/CodeEditor";
import Button from "@/shared/ui/Button";
import AppIcon from "@/shared/ui/AppIcon";
import Modal from "@/shared/ui/Modal";
import useSchemasHook from "@/features/schemas/hooks/useSchemas";
import useSchemas from "@/features/schemas/store/useSchemas";
import { EditFormat } from "@/shared/utils/editFormat";
import { parseModelToJsonSchema } from "@/features/schemas/utils/data-model";

const PreviewModal: React.FC<any> = (props) => {
  const { value, onCancel, themeToken } = props;
  const { schemasBaseData } = useSchemas((state) => state);
  const { getProxyMockRulesList } = useSchemasHook();
  const { t } = useTranslation();
  const [viewText, setViewText] = useState("");

  useEffect(() => {
    if (isObject(value)) {
      handleViewSchemaText(value);
    }
  }, [value]);

  const handleViewSchemaText = useMemoizedFn(async (dataModel) => {
    const schema = await parseModelToJsonSchema(
      dataModel,
      [],
      schemasBaseData || {},
    );
    const schemaData = cloneDeep(schema);
    if (!isObject(schemaData)) {
      return;
    }
    const mock_rules = getProxyMockRulesList();
    import("@onapi/domain/mock/schema")
      .then(({ default: MockSchema }) =>
        new (MockSchema as any)({ app: "onapi" }).mock(schemaData, mock_rules),
      )
      .then(async (mockData: any) => {
        if (isObject(mockData)) {
          const beautifyText = (await EditFormat(JSON.stringify(mockData)))
            .value;
          setViewText(beautifyText);
        } else {
          setViewText(mockData);
        }
      })
      .catch(() => {
        message.error(t("supplement.parse_err"));
        setViewText("");
      });
  });

  const handleUpdateText = useMemoizedFn(() => {
    handleViewSchemaText(value);
  });

  return (
    <Modal
      width={880}
      open
      title={
        <div className={styles.previewTitle}>
          <span>{t("common.schema.view")}</span>
          <Button
            onClick={handleUpdateText}
            icon={<AppIcon icon="refresh-cw" />}
            className={styles.button}
          ></Button>
        </div>
      }
      onCancel={onCancel}
      footer={null}
    >
      <div className={styles.preview}>
        <CodeEditor
          readOnly
          height={400}
          language="json"
          value={viewText || ""}
        />
      </div>
    </Modal>
  );
};

export default memo(PreviewModal);
