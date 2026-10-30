import styles from "./QuoteOption.module.css";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { Flex } from "@/shared/ui/base";

import clsx from "clsx";

import { Empty, Tooltip } from "@/shared/ui";
import {
  variableContext,
  variableDisplayText,
  variableScopeLabel,
} from "../../../utils/variable-display";
import useProjectConfig from "@/features/project/store/useProjectConfig";

interface Props {
  value: string;
  onChange: (v: string) => void;
}

const Index = ({ value, onChange }: Props) => {
  const { t } = useTranslation();
  const http = useProjectConfig((state) => state.http);
  const [index, setIndex] = useState(0);
  const list = useMemo(
    () =>
      [...variableContext(http).values()].filter((item) =>
        item.name.toLowerCase().includes(value.toLowerCase()),
      ),
    [http, value],
  );
  const current = list[index] ?? list[0];

  return (
    <div className={styles.container}>
      {list.length ? (
        <>
          <div className={styles.list}>
            {list.map((item, index) => (
              <div
                key={item.name}
                className={styles.listItem}
                onFocus={() => setIndex(index)}
                onMouseOver={() => setIndex(index)}
                onMouseDown={() => {
                  onChange(item.name);
                  setIndex(index);
                }}
              >
                <div
                  className={clsx(styles.listItemIcon, {
                    [styles.e]: item.scope === "environment",
                    [styles.g]: item.scope === "global",
                  })}
                >
                  {item.scope === "environment"
                    ? "E"
                    : item.scope === "collection"
                      ? "C"
                      : item.scope === "system"
                        ? "S"
                        : "G"}
                </div>
                <div className={styles.listItemKey}>
                  <Tooltip title={item.name}>{item.name}</Tooltip>
                </div>
              </div>
            ))}
          </div>
          <div className={styles.content}>
            {current && (
              <>
                <Flex gap={4} vertical>
                  <span className={styles.label}>
                    {t("supplement.var_name")}
                  </span>
                  <span className={styles.value}>{current.name}</span>
                </Flex>
                <Flex gap={4} vertical>
                  <span className={styles.label}>
                    {t("interaction.configuredValue")}
                  </span>
                  <span className={styles.value}>
                    {variableDisplayText(current, t)}
                  </span>
                </Flex>
                <Flex gap={4} vertical>
                  <span className={styles.label}>{t("supplement.scope")}</span>
                  <span className={styles.value}>
                    {variableScopeLabel(current.scope, t)}
                  </span>
                </Flex>
              </>
            )}
          </div>
        </>
      ) : (
        <Empty wrapStyle={{ width: "100%" }} />
      )}
    </div>
  );
};

export default Index;
