import styles from "../index.module.css";
import React, { memo, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { message } from "@/shared/ui/base";

import { useMemoizedFn } from "ahooks";
import { isObject, isString } from "lodash";

import CodeEditor from "@/shared/components/CodeEditor";
import Modal from "@/shared/ui/Modal";
import { isJSON } from "@/shared/utils/common";

const EditRow: React.FC<any> = (props) => {
  const { t } = useTranslation();
  const { value, onChange, onCancel } = props;

  const [tempText, setTempText] = useState(value);

  const handleConfirm = useMemoizedFn(() => {
    if (!isJSON(tempText)) {
      message.error(t("supplement.only_json_pick"));
      return;
    }
    const data = JSON.parse(tempText);
    onChange(data);
    onCancel();
  });

  useEffect(() => {
    let jsonText = null;
    try {
      jsonText = JSON.stringify(tempText, null, 2);
    } catch (ex) {
      jsonText = "";
      message.error(t("supplement.parse_exception"));
    }
    const beautifyText = isObject(tempText) ? jsonText : "";

    setTempText(beautifyText);
  }, []);

  return (
    <Modal
      open
      width={880}
      title="Raw"
      onCancel={onCancel}
      onOk={handleConfirm}
      cancelText={t("supplement.cancel")}
      okText={t("supplement.confirm")}
    >
      <div className={styles.editRaw}>
        {isString(tempText) && (
          <CodeEditor language="json" value={tempText} onChange={setTempText} />
        )}
      </div>
    </Modal>
  );
};

export default memo(EditRow);
