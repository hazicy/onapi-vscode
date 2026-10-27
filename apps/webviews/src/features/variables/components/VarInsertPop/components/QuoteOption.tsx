import { selectActiveEnvironment } from "@/features/project/store/useProjectConfig/selectors";
import styles from "./QuoteOption.module.css";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { Flex } from "@/shared/ui/base";

import classNames from "classnames";
import { concat, entries, filter, find, isString, map, size } from "lodash-es";

import { Empty, Tooltip } from "@/shared/ui";
import { SYSTEM_VARS } from "@/shared/constants/system";
import useProjectConfig from "@/features/project/store/useProjectConfig";

interface Props {
  value: string;
  onChange: (v: string) => void;
}

enum ListType {
  env,
  global,
  inner,
}

const Index = ({ value, onChange }: Props) => {
  const { t } = useTranslation();
  const globalVars = useProjectConfig(
    (state) => state.http.options.globals.values,
  );
  const environment = useProjectConfig(selectActiveEnvironment);
  const [index, setIndex] = useState(0);

  const list = useMemo(() => {
    const displayValues = (values: typeof globalVars, type: ListType) =>
      (values || [])
        .filter((item) => !item.disabled)
        .map((item) => ({
          key: item.key || "",
          value:
            typeof item.value === "string"
              ? item.value
              : JSON.stringify(item.value),
          type,
        }));
    const envVarList = displayValues(environment?.values, ListType.env);
    const globalVarList = displayValues(globalVars, ListType.global);
    const systemVarList = map(entries(SYSTEM_VARS), ([key, value]) => ({
      key: `$${key}`,
      value,
      type: ListType.inner,
    }));
    return filter(concat(envVarList, globalVarList, systemVarList), (item) =>
      (item?.key as string)?.toLowerCase().includes(value?.toLowerCase() || ""),
    );
  }, [value, globalVars, environment]);

  return (
    <div className={styles.container}>
      {size(list) ? (
        <>
          <div className={styles.list}>
            {map(list, (item, index) => (
              <div
                className={styles.listItem}
                onFocus={() => setIndex(index)}
                onMouseOver={() => setIndex(index)}
                onMouseDown={() => {
                  onChange(item.key);
                  setIndex(index);
                }}
              >
                <div
                  className={classNames(styles.listItemIcon, {
                    [styles.e]: item?.type === ListType.env,
                    [styles.g]: item?.type === ListType.global,
                  })}
                >
                  {item?.type === ListType.env ? "E" : "G"}
                </div>
                <div className={styles.listItemKey}>
                  <Tooltip title={item.key}>{item.key}</Tooltip>
                </div>
              </div>
            ))}
          </div>
          <div className={styles.content}>
            {list[index] && (
              <>
                <Flex gap={4} vertical>
                  <span className={styles.label}>
                    {t("supplement.var_name")}
                  </span>
                  <span className={styles.value}>{list[index]?.key || ""}</span>
                </Flex>
                <Flex gap={4} vertical>
                  <span className={styles.label}>
                    {t("supplement.var_value")}
                  </span>
                  <span className={styles.value}>
                    {list[index]?.value || ""}
                  </span>
                </Flex>
                <Flex gap={4} vertical>
                  <span className={styles.label}>{t("supplement.scope")}</span>
                  <span className={styles.value}>
                    {list[index]?.type === ListType.env
                      ? t("supplement.var_env")
                      : t("supplement.var_glo")}
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
