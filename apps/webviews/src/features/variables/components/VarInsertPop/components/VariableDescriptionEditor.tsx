import { useState } from "react";
import { useTranslation } from "react-i18next";
import clsx from "clsx";
import { Flex, Input } from "@/shared/ui/base";
import { AppIcon, Empty } from "@/shared/ui";
import { VAR_OPTIONS_KEY } from "@/features/variables/constants/variable";
import useProjectSetting from "@/features/project/store/useProjectSetting";
import styles from "./VarContent.module.css";

interface Props {
  option: VAR_OPTIONS_KEY;
  value: string;
  onChange: (value: string) => void;
  onRefresh?: () => void;
}

export default function VariableDescriptionEditor({
  option,
  value,
  onChange,
  onRefresh,
}: Props) {
  const { t } = useTranslation();
  const [selectedId, setSelectedId] = useState("");
  const descriptions = useProjectSetting((state) => state.descriptionList);
  return (
    <Flex flex={1} style={{ width: "100%", overflowY: "auto" }}>
      {option === VAR_OPTIONS_KEY.desc ? (
        <Flex vertical className={styles.descList}>
          {descriptions.length ? (
            descriptions.map((item) => (
              <div
                key={item.id}
                onClick={() => {
                  setSelectedId(item.id);
                  onChange(item.description);
                }}
                className={clsx(styles.descItem, {
                  [styles.active]: item.id === selectedId,
                })}
              >
                {item.description}
              </div>
            ))
          ) : (
            <Empty wrapStyle={{ width: "100%" }} />
          )}
        </Flex>
      ) : (
        <Flex gap={8} vertical className={styles.descAi}>
          <Flex gap={4} vertical>
            <span className={styles.descAiTitle}>
              {t("var_insert.current_key")}
            </span>
            <span className={styles.descAiKey}>''</span>
          </Flex>
          <Flex gap={4} vertical>
            <span className={[styles.descAiTitle, styles.refresh].join(" ")}>
              <span>{t("settings.description.param_desc")}</span>
              <span onClick={onRefresh} className={styles.paramsRefresh}>
                <AppIcon icon="refresh-cw" className={styles.icon} />
                {t("base.refresh")}
              </span>
            </span>
            <Input.TextArea
              value={value}
              onChange={(event) => onChange(event.target.value)}
              maxLength={1024}
              autoSize={{ minRows: 8, maxRows: 18 }}
              inputClassName={styles.input}
            />
          </Flex>
        </Flex>
      )}
    </Flex>
  );
}
