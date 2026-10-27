import { useTranslation } from "react-i18next";
import { Flex, Spin, message } from "@/shared/ui/base";
import { AppIcon, Button, Tooltip } from "@/shared/ui";
import { copyStringToClipboard } from "@/shared/utils/common";
import { VAR_OPTIONS_KEY } from "@/features/variables/constants/variable";
import { InsertAction } from "@onapi/domain/requests/types/variable";
import { getInsertionValue } from "./variable-expression";
import styles from "./VarContent.module.css";

interface Props {
  value: string;
  expression: string;
  optionKey: VAR_OPTIONS_KEY;
  isEdit: boolean;
  isInsertDynamic?: boolean;
  previewText: string;
  previewLoading: boolean;
  updatePreviewText: () => void;
  onChange: (value: string, action: InsertAction) => void;
}

export default function VariableInsertFooter({
  value,
  expression,
  optionKey,
  isEdit,
  isInsertDynamic,
  previewText,
  previewLoading,
  updatePreviewText,
  onChange,
}: Props) {
  const { t } = useTranslation();
  const confirm = (action: InsertAction) =>
    onChange(getInsertionValue(optionKey, value, expression), action);
  return (
    <Flex gap={16} vertical className={styles.footer}>
      {value &&
        ![VAR_OPTIONS_KEY.desc, VAR_OPTIONS_KEY.ai_desc].includes(
          optionKey,
        ) && (
          <Flex gap={8} className={styles.footerPreview} vertical>
            <span className={styles.previewTip}>
              <span>{t("common.assertion.expression.title")}</span>
            </span>
            <div
              className={styles.previewContent}
              aria-label="Variable expression"
            >
              <span className={styles.previewContentText}>
                <Tooltip placement="topLeft" title={expression}>
                  {expression}
                </Tooltip>
              </span>
              <AppIcon
                onClick={() =>
                  copyStringToClipboard(expression, () =>
                    message.success(t("supplement.copy_success")),
                  )
                }
                icon="copy"
                className={styles.icon}
              />
            </div>
            <span className={styles.previewTip}>
              <Flex gap={4}>
                {t("common.api_tab.preview")}
                <span
                  onClick={updatePreviewText}
                  className={styles.previewRefresh}
                >
                  <AppIcon icon="refresh-cw" className={styles.icon} />
                </span>
              </Flex>
            </span>
            <Spin spinning={previewLoading}>
              <div
                className={styles.previewContent}
                aria-label="Variable preview"
              >
                <span className={styles.previewContentText}>
                  <Tooltip placement="topLeft" title={previewText}>
                    {previewText}
                  </Tooltip>
                </span>
                <AppIcon
                  onClick={() =>
                    copyStringToClipboard(previewText, () =>
                      message.success(t("supplement.copy_success")),
                    )
                  }
                  icon="copy"
                  className={styles.icon}
                />
              </div>
            </Spin>
          </Flex>
        )}
      <Flex gap={12} className={styles.footerBth}>
        {(isEdit &&
          [
            VAR_OPTIONS_KEY.var,
            VAR_OPTIONS_KEY.mock,
            VAR_OPTIONS_KEY.fixed,
            VAR_OPTIONS_KEY.ai_value,
          ].includes(optionKey)) ||
        isInsertDynamic ? (
          <Flex style={{ width: "100%" }} justify="flex-end">
            <Button
              disabled={!value}
              size="small"
              type="primary"
              onClick={() => confirm(InsertAction.confirm)}
            >
              {t("common.confirm")}
            </Button>
          </Flex>
        ) : (
          <>
            <Button
              disabled={!value}
              onClick={() => confirm(InsertAction.replace)}
              size="small"
            >
              {t("var_insert.replace")}
            </Button>
            <Button
              disabled={!value}
              onClick={() => confirm(InsertAction.insert)}
              size="small"
            >
              {t("var_insert.insert")}
            </Button>
          </>
        )}
      </Flex>
    </Flex>
  );
}
