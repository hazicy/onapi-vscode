import styles from "../../RequestTable.module.css";
import { FC, memo, useRef, useState } from "react";

import { Input } from "@/shared/ui/base";
import { TextAreaProps } from "@/shared/ui/base";

import { useUpdateEffect } from "ahooks";
import { isString, trim } from "lodash";

import { ItemProps } from "../../types";

const lineHeight = 32;

type Props = ItemProps & {
  showAiDescription?: boolean;
  showDelete?: boolean;
};

export const RowDescription: FC<Props> = memo((props) => {
  const { rowData, rowIndex, onChange, readOnly } = props;

  const isComposition = useRef(false);
  const [curValue, setCurValue] = useState(rowData?.description);

  useUpdateEffect(() => {
    setCurValue(rowData?.description);
  }, [rowData?.description]);

  const handleChange = (key: string, newVal: string | number) => {
    const newRowData = {
      ...rowData,
      [key]: newVal,
    };
    onChange?.(rowIndex, newRowData);
  };

  const handlerInput = (e: any) => {
    const tar = e.target as HTMLTextAreaElement,
      scrollHeight = tar?.scrollHeight;

    if (scrollHeight <= lineHeight || tar.value.length === 0) {
      tar.style.height = lineHeight + "px";
    } else {
      tar.style.height = scrollHeight + "px";
    }
  };

  const handleInputChange: TextAreaProps["onChange"] = (event) => {
    const rawValue = event.target.value;

    setCurValue(rawValue);

    if (!isComposition.current) {
      handleChange?.("description", rawValue);
    }
  };

  const handleCompositionStart = () => {
    isComposition.current = true;
  };

  const handleCompositionEnd = (event: any) => {
    isComposition.current = false;
    handleChange?.("description", event.currentTarget.value);
  };

  const handlerBlur = (e: any) => {
    const tar = e.target as HTMLTextAreaElement;
    tar.style.height = lineHeight + "px";

    if (!rowData?.key) {
      return;
    }

    if (
      !isString(rowData?.description) ||
      trim(rowData.description).length <= 0
    ) {
      return;
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.rowDescription}>
        <Input.TextArea
          readOnly={readOnly}
          autoSize={false}
          style={{
            position: "absolute",
            minHeight: 36,
            top: 0,
            height: 36,
            lineHeight: "26px",
          }}
          placeholder={""}
          variant="borderless"
          value={curValue}
          onInput={handlerInput}
          onFocus={handlerInput}
          onBlur={handlerBlur}
          onChange={handleInputChange}
          onCompositionStart={handleCompositionStart}
          onCompositionEnd={handleCompositionEnd}
          inputClassName={styles.input}
        />
      </div>
    </div>
  );
});

export default RowDescription;
