import styles from "./ModelSettings.module.css";
import React, { memo } from "react";
import { useTranslation } from "react-i18next";

import { Input } from "@/shared/ui/base";

import clsx from "clsx";
import { isPlainObject } from "lodash-es";

import Button from "@/shared/ui/Button";
import Tooltip from "@/shared/ui/Tooltip";

interface Props {
  value: any;
  overrideData: any;
  onShow: () => void;
  onHide: () => void;
  onLinkItem: () => void;
  onCancelLinkItem: () => void;
  onChange: (key: string, newVal: string) => void;
}

const ItemMock: React.FC<Props> = (props) => {
  const { t } = useTranslation();
  const {
    value,
    overrideData,
    onShow,
    onHide,
    onLinkItem,
    onCancelLinkItem,
    onChange,
  } = props;

  const isUnLinkState = isPlainObject(overrideData);

  return (
    <div>
      <div className={styles.container}>
        {isUnLinkState ? (
          <>
            <Input
              style={{
                flex: 1,
                border: "none",
                outline: "none",
                boxShadow: "none",
                backgroundColor: "transparent",
              }}
              size="small"
              value={value?.description}
              onChange={(e) => {
                onChange("description", e.target.value);
              }}
            />
            <Tooltip title={t("supplement.reallocate")}>
              <Button
                size="small"
                onClick={onLinkItem}
                className={styles.button}
              >
                {t("supplement.reallocate")}
              </Button>
            </Tooltip>
          </>
        ) : (
          <>
            <Input
              size="small"
              style={{
                flex: 1,
                border: "none",
                outline: "none",
                boxShadow: "none",
                backgroundColor: "transparent",
              }}
              disabled
              value={value?.description}
            />
            <Button
              onClick={onCancelLinkItem}
              className={styles.btnHide}
              size="small"
            >
              {t("supplement.disassociate")}
            </Button>
            {overrideData === null ? (
              <Button onClick={onShow} className={styles.btnHide} size="small">
                {t("supplement.show_field")}
              </Button>
            ) : (
              <Button onClick={onHide} className={styles.btnHide} size="small">
                {t("supplement.hide_field")}
              </Button>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default memo(ItemMock);
