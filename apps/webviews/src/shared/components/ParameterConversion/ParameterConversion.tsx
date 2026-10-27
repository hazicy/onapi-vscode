import styles from "./ParameterConversion.module.css";
import { useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";

import { Flex, Segmented, SegmentedProps, message } from "@/shared/ui/base";

import { useMemoizedFn, useSafeState } from "ahooks";
import { importParameters, exportParameters } from "./convert";
import { snowflakeId } from "@onapi/domain/utils/data-tools";
import { hasIn, includes, isArray, isString } from "lodash-es";

import CodeEditor from "@/shared/components/CodeEditor/CodeEditor";
import Button from "@/shared/ui/Button";
import Modal from "@/shared/ui/Modal";
import { copyStringToClipboard } from "@/shared/utils/common";

import { EDIT_OPTIONS, EXPORT_OPTIONS, IMPORT_OPTIONS } from "./constant";
import { EXPORT_ENUM, PARAMETER_TYPE } from "./type";

interface Props {
  open: boolean;
  value: any;
  noDesc?: boolean;
  parameterType: PARAMETER_TYPE;
  onCancel: () => void;
  onChange: (v: Props["value"]) => void;
}

const ParameterConversion = (props: Props) => {
  const {
    open,
    parameterType,
    onCancel,
    value,
    onChange: importChange,
    noDesc = false,
  } = props;

  const { t } = useTranslation();

  const [editValue, setEditValue] = useSafeState<string>("");
  const [typeValue, setTypeValue] = useSafeState<EXPORT_ENUM>(EXPORT_ENUM.DESC);

  const parameterInfo: { title: string; options: SegmentedProps["options"] } =
    useMemo(() => {
      if (parameterType === PARAMETER_TYPE.EXPORT) {
        return {
          title: t("common.export_modal.title"),
          options: noDesc ? IMPORT_OPTIONS : EXPORT_OPTIONS,
        };
      }

      if (parameterType === PARAMETER_TYPE.IMPORT) {
        return {
          title: t("common.import_modal.title"),
          options: IMPORT_OPTIONS,
        };
      }

      if (parameterType === PARAMETER_TYPE.BATCH_EDIT) {
        return {
          title: t("common.request_table.batch_edit"),
          options: EDIT_OPTIONS,
        };
      }

      return { title: "", options: [] };
    }, [parameterType, noDesc, t]);

  const computedTipText = useMemo(() => {
    if (parameterType === PARAMETER_TYPE.EXPORT) {
      return "";
    }
    if (
      parameterType === PARAMETER_TYPE.BATCH_EDIT &&
      typeValue === EXPORT_ENUM.DESC
    ) {
      return "";
    }

    if (typeValue === EXPORT_ENUM.KEY) {
      return t("common.import_modal.key_value_tip");
    }

    return t("common.import_modal.raw_json_tip");
  }, [parameterType, t, typeValue]);

  const computedConfirmText = useMemo(() => {
    if (parameterType === PARAMETER_TYPE.EXPORT) {
      return t("common.export_modal.copy");
    }

    if (parameterType === PARAMETER_TYPE.IMPORT) {
      return t("common.import_modal.import");
    }

    if (parameterType === PARAMETER_TYPE.BATCH_EDIT) {
      return t("supplement.confirm");
    }

    return "";
  }, [parameterType, t]);

  useEffect(() => {
    if (!open) {
      return;
    }

    if (
      includes(
        [PARAMETER_TYPE.EXPORT, PARAMETER_TYPE.BATCH_EDIT],
        parameterType,
      )
    ) {
      if (noDesc || parameterType === PARAMETER_TYPE.BATCH_EDIT) {
        setTypeValue(EXPORT_ENUM.KEY);
        updateText(EXPORT_ENUM.KEY);
      } else {
        setTypeValue(EXPORT_ENUM.DESC);
        updateText(EXPORT_ENUM.DESC);
      }
      return;
    } else {
      setTypeValue(EXPORT_ENUM.KEY);
      setEditValue("");
    }
  }, [noDesc, open, parameterType]);

  const updateText = useMemoizedFn((type: EXPORT_ENUM) => {
    const arr = importParameters(editValue);
    const v = includes(
      [PARAMETER_TYPE.EXPORT, PARAMETER_TYPE.BATCH_EDIT],
      parameterType,
    )
      ? value
      : arr;
    const exportVal = exportParameters(v || [], type);

    setEditValue(exportVal);
  });

  const onChange: SegmentedProps["onChange"] = (value) => {
    setTypeValue(value as EXPORT_ENUM);
    updateText(value as EXPORT_ENUM);
  };

  const handleCopy = () => {
    copyStringToClipboard(editValue, () =>
      message.success(t("supplement.clipboard_success")),
    );
  };

  const handleImport = () => {
    if (editValue === "" || !editValue?.trim()) {
      message.error(
        parameterType === PARAMETER_TYPE.IMPORT
          ? t("supplement.imp_tip")
          : t("supplement.imp_edit_tip"),
      );
      return;
    }

    const importList = importParameters(editValue);

    if (isArray(importList) && importList.length > 0) {
      for (let i = 0; i < importList.length; i++) {
        const ite: any = importList[i];
        if (!hasIn(ite, "type")) {
          ite.type = "Text";
        }
        if (ite?.field_type === "Text") {
          ite.field_type = "String";
        }
        if (!isString(ite.value)) {
          ite.value = "";
        }
        if (!hasIn(ite, "param_id")) {
          ite.param_id = snowflakeId();
        }
      }

      if (importChange) {
        importChange(importList);
      }

      message.success(
        parameterType === PARAMETER_TYPE.IMPORT
          ? t("supplement.imp_success")
          : t("supplement.imp_edit_success"),
      );
    }
  };

  const handleOperate = () => {
    if (parameterType === PARAMETER_TYPE.EXPORT) {
      handleCopy();
    } else {
      handleImport();
    }

    onCancel();
  };

  const footer = (
    <Flex gap={10} align="center" justify="space-between">
      <span className={styles.tip}>{computedTipText}</span>
      <Flex gap={10}>
        <Button onClick={onCancel}>{t("common.import_modal.cancel")}</Button>
        {parameterType === PARAMETER_TYPE.BATCH_EDIT && (
          <Button onClick={handleCopy}>{t("common.export_modal.copy")}</Button>
        )}
        <Button type="primary" onClick={handleOperate}>
          {computedConfirmText}
        </Button>
      </Flex>
    </Flex>
  );

  return (
    <Modal
      footer={footer}
      width={880}
      onCancel={onCancel}
      title={parameterInfo?.title}
      open={open}
    >
      <div className={styles.container}>
        <Segmented
          value={typeValue}
          options={parameterInfo?.options}
          onChange={onChange}
          className={styles.segmented}
          itemClassName={styles.segmentedItem}
        />
        <CodeEditor
          height={400}
          value={editValue}
          readOnly={parameterType === PARAMETER_TYPE.EXPORT}
          language={typeValue === EXPORT_ENUM.KEY ? "text" : "json"}
          onChange={(e: string) => setEditValue(e)}
        />
      </div>
    </Modal>
  );
};

export default ParameterConversion;
