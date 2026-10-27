import styles from "./ItemMock.module.css";
import React, { memo, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";

import { AutoComplete } from "@/shared/ui/base";

import { useMemoizedFn } from "ahooks";
import clsx from "clsx";
import { produce } from "immer";
import { entries, isNumber, isPlainObject, isString } from "lodash-es";

import { SYSTEM_VARS } from "@/shared/constants/system";

import { useSchemaContext } from "../context";
import SplitBar from "./SplitBar";

interface Props {
  disabled: boolean;
  value: any;
  onChange: (key: string, newVal: any) => void;
  isModelItem: boolean | undefined;
  deepIndex: number;
  overrideData?: any;
}

const ItemMock: React.FC<Props> = (props) => {
  const { disabled, value, onChange, isModelItem, deepIndex, overrideData } =
    props;
  const { t } = useTranslation();
  const isUnLinkState = isPlainObject(overrideData);

  const { refTable, layouts, setLayouts } = useSchemaContext();
  const currentLayout = layouts?.[1];
  const tdWidth = currentLayout?.width ?? 400;

  const handleChange = (val: string) => {
    onChange("mock", {
      mock: val,
    });
  };

  const handleUpdateWidth = useMemoizedFn((newWidth) => {
    const newLayouts = produce(layouts, (draft) => {
      draft[1].width = newWidth;
      draft[1].flex = "unset";
    });
    setLayouts(newLayouts);
  });

  useEffect(() => {
    if (deepIndex !== 0) {
      return;
    }
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width } = entry.contentRect;

        let newWidth = 0;
        if (isNumber(layouts[0]?.width)) {
          newWidth = (width - layouts[0]?.width) / 2;
        } else {
          newWidth = width / 3;
        }
        if (!isNumber(currentLayout.width) && newWidth > 100) {
          handleUpdateWidth(newWidth);
        }
      }
    });
    resizeObserver.observe(refTable.current);
    return () => {
      resizeObserver.disconnect();
    };
  }, [refTable, layouts]);

  const dataList = useMemo(() => {
    return entries(SYSTEM_VARS)?.map(([value, label]) => ({
      label: (
        <div>
          <div>${value}</div>
          <div style={{ whiteSpace: "pre-wrap" }}>{label}</div>
        </div>
      ),
      value: `$${value}`,
    }));
  }, []);

  return (
    <div style={{ ...currentLayout, width: "100%" }}>
      <div className={clsx(styles.container, {})}>
        <AutoComplete
          size="small"
          filterOption
          style={{ width: "100%" }}
          className={styles.mockAutoVars}
          placeholder={t("common.schema.mock")}
          disabled={disabled || (isModelItem && !isUnLinkState)}
          value={isString(value?.mock?.mock) ? value?.mock?.mock : ""}
          onChange={handleChange}
          options={dataList}
          triggerClassName={styles.selectTrigger}
        />
        {deepIndex === 0 && (
          <SplitBar
            minWidth={200}
            refTable={refTable}
            key={tdWidth}
            width={tdWidth}
            onUpdateWidth={handleUpdateWidth}
          />
        )}
      </div>
    </div>
  );
};

export default memo(ItemMock);
