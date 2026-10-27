import type { CodeEditorRef } from "@/shared/components/CodeEditor/CodeEditor";
import styles from "./PathPickModal.module.css";
import Modal from "@/shared/ui/Modal";
import classNames from "classnames";
import { FC, useEffect, useMemo, useRef } from "react";
import { useTranslation } from "react-i18next";

import { Input, ModalProps } from "@/shared/ui/base";

import { useSafeState } from "ahooks";
import { isJson } from "@onapi/domain/utils/data-tools";
import { isXml } from "@onapi/domain/utils/response-tools";
import { XMLBuilder } from "fast-xml-parser";
import jsonpath from "jsonpath";
import {
  isArray,
  isEmpty,
  isEqual,
  isNull,
  isObject,
  isString,
  isUndefined,
} from "lodash-es";
import X2JS from "x2js";
import xpath from "xpath";

import CodeEditor from "@/shared/components/CodeEditor/CodeEditor";

type Props = ModalProps & {
  defaultValue?: string;
  type: "json" | "xml";
};

const PathPickModal: FC<Props> = ({
  defaultValue = "",
  type,
  ...resetProps
}) => {
  const { t } = useTranslation();
  const refEditor = useRef<CodeEditorRef | null>(null);

  const [value, setValue] = useSafeState(defaultValue);
  const [expression, setExpression] = useSafeState("");

  useEffect(() => {
    if (isEmpty(defaultValue) && isEqual(type, "json")) {
      setValue("{}");
    } else {
      setValue(defaultValue);
    }
    setExpression("");
  }, [type]);

  useEffect(() => {
    setTimeout(() => {
      refEditor.current?.formatEditor();
    }, 0);
    // json
    if (isEqual(type, "json")) {
      // If it is XML
      if (isXml(defaultValue)) {
        try {
          const x2js = new X2JS();
          const jsonValue = x2js.xml2js(defaultValue);
          const jsonStr = JSON.stringify(isObject(jsonValue) ? jsonValue : {});
          setValue(jsonStr);
        } catch (err) {}
        return;
      }
      if (isEmpty(defaultValue)) {
        setValue("{}");
        return;
      }
    }

    // xml
    if (isEqual(type, "xml")) {
      // If it is JSON, need to convert to XML
      if (isJson(defaultValue)) {
        try {
          const XmlParse = new XMLBuilder();
          const xmlText = XmlParse.build(JSON.parse(defaultValue));
          setValue(xmlText);
        } catch (err) {}
        return;
      }
    }

    setValue(defaultValue);
  }, [defaultValue, resetProps.open]);

  const computedJsonPathValue = useMemo(() => {
    let result = t("supplement.no_pick_result");
    if (!isString(value) || isEqual(type, "xml")) {
      return result;
    }
    try {
      const resultObj = JSON.parse(value);
      if (!isObject(resultObj)) {
        return result;
      }
      const queryResult = jsonpath.value(resultObj, expression);
      if (isObject(queryResult)) {
        return JSON.stringify(queryResult, null, "\t");
      }
      if (isNull(queryResult)) {
        return "null";
      }
      if (isUndefined(queryResult)) {
        return t("supplement.no_pick_result");
      }
      return queryResult;
    } catch (err: any) {
      result = err.toString();
    }

    return result;
  }, [value, expression, type]);

  const computedXmlPathValue = useMemo(() => {
    let result = t("supplement.no_pick_result");
    if (!isString(value) || isEqual(type, "json")) {
      return result;
    }
    try {
      const resultObj = new DOMParser().parseFromString(value, "text/xml");
      const nodes = xpath.select(expression, resultObj);
      const tempResult: any[] = [];
      if (!isArray(nodes)) {
        return result;
      }
      nodes?.forEach((node) => {
        const xmlStr = new XMLSerializer().serializeToString(node);
        if (isString(xmlStr) && xmlStr.length > 0) {
          tempResult.push(xmlStr);
        }
      });
      if (isEmpty(tempResult)) {
        return result;
      }
      return tempResult.join("\n");
    } catch (err: any) {
      result = err.toString();
    }
    return result;
  }, [value, expression, type]);

  const computedInfo = useMemo(() => {
    if (isEqual(type, "json")) {
      return {
        title: "JSON",
        modalTitle: t("supplement.json_path_pick"),
        placeholder: t("supplement.jsonpath_exp_tip"),
        language: "json",
        computedPathValue: computedJsonPathValue,
      };
    }
    return {
      title: "XML",
      modalTitle: t("supplement.xpath_tool"),
      placeholder: t("supplement.xpath_exp_tip"),
      language: "xml",
      computedPathValue: computedXmlPathValue,
    };
  }, [type, computedJsonPathValue, computedXmlPathValue]);

  return (
    <Modal
      width={760}
      footer={null}
      destroyOnClose
      title={computedInfo.modalTitle}
      {...resetProps}
      className={classNames(styles.container, resetProps.className)}
    >
      <Input
        placeholder={computedInfo.placeholder}
        spellCheck={false}
        value={expression}
        onChange={(event) => setExpression(event.target.value)}
      />
      <div className={styles.jsonPathContent}>
        <div className={styles.layoutItem}>
          <div className={styles.itemTitle}>{computedInfo.title}</div>
          <div className={styles.itemContent}>
            <CodeEditor
              ref={refEditor}
              language={computedInfo.language}
              className={styles.codeEditorValue}
              value={value}
              onChange={setValue}
            />
          </div>
        </div>
        <div className={styles.layoutItem}>
          <div className={styles.itemTitle}>{t("supplement.pick_result")}</div>
          <div className={styles.itemContent}>
            <CodeEditor
              language="text"
              className={styles.codeEditorValue}
              readOnly
              value={computedInfo.computedPathValue}
            />
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default PathPickModal;
