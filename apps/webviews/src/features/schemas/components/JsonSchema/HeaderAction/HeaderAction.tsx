import classNames from "classnames";
import styles from "./HeaderAction.module.css";
import React, { lazy, memo, Suspense, useState } from "react";
import { useTranslation } from "react-i18next";

import { Flex, Tooltip } from "@/shared/ui/base";

import { isObject } from "lodash-es";

import Button from "@/shared/ui/Button";
import AppIcon from "@/shared/ui/AppIcon";
import useTheme from "@/shared/hooks/useTheme";

const EditRow = lazy(() => import("./modals/EditRaw"));
const ImportModal = lazy(() => import("./modals/ImportModal"));
const PreviewModal = lazy(() => import("./modals/PreviewModal"));

type Props = {
  value: any;
  onChange: (newVal: any) => void;
  importTitle?: string;
  style?: React.CSSProperties;
};

const HeaderAction: React.FC<Props> = (props) => {
  const { value, onChange, importTitle, style } = props;
  const { themeToken } = useTheme();
  const [modalType, setModalType] = useState("");
  const shemaData = isObject(value) ? value : {};
  const { t } = useTranslation();
  return (
    <div className={styles.container}>
      <Suspense fallback={null}>
        {modalType === "import" && (
          <ImportModal
            themeToken={themeToken}
            onChange={onChange}
            onCancel={() => setModalType("")}
          />
        )}
        {modalType === "preview" && (
          <PreviewModal
            themeToken={themeToken}
            value={value}
            onCancel={() => setModalType("")}
          />
        )}
        {modalType === "edit-raw" && (
          <EditRow
            value={shemaData}
            onChange={onChange}
            onCancel={() => setModalType("")}
          />
        )}
      </Suspense>
      <div className={styles.actionRight} style={style}>
        <Flex gap={8}>
          <Tooltip title={t("common.schema.raw")}>
            <AppIcon
              style={{ color: "var(--icon-color)", cursor: "pointer" }}
              onClick={() => setModalType("edit-raw")}
              icon="pencil"
            />
          </Tooltip>

          <Tooltip title={t("common.schema.view")}>
            <AppIcon
              style={{ color: "var(--icon-color)", cursor: "pointer" }}
              onClick={() => setModalType("preview")}
              icon="eye"
            />
          </Tooltip>

          <Button
            icon={<AppIcon icon="file-input" />}
            mode="light"
            size="small"
            className={classNames(styles.previewBtn, styles.button)}
            type="primary"
            onClick={() => setModalType("import")}
          >
            {importTitle || t("supplement.imp")}
          </Button>
        </Flex>
      </div>
    </div>
  );
};

export default memo(HeaderAction);
