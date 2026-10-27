import styles from "./index.module.css";
import { memo } from "react";
import { useTranslation } from "react-i18next";

import { size } from "lodash";

import Empty from "@/shared/ui/Empty";

import Content from "./Content";
import { ConsoleContentProps } from "./types";

const Console = memo(({ consoleList = [] }: ConsoleContentProps) => {
  const { t } = useTranslation();
  return (
    <div className={styles.container}>
      <div className={styles.console}>
        {size(consoleList) <= 0 ? (
          <Empty description={t("supplement.no_console")} />
        ) : (
          <Content consoleList={consoleList} />
        )}
      </div>
    </div>
  );
});

export default Console;
