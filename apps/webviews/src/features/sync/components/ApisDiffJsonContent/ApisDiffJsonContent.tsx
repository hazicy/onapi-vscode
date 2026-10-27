import styles from "./ApisDiffJsonContent.module.css";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Collapse } from "@/shared/ui/base";
import { Empty } from "@/shared/ui";
import type { EnvListItem } from "@onapi/domain/environment/types/index";
import Edit from "./Edit";
import {
  compareEnvironments,
  ENVIRONMENT_SECTIONS,
} from "../../utils/environment-comparison";

interface Props {
  prevDetails?: EnvListItem;
  nextDetails?: EnvListItem;
}

const ApisDiffJsonContent = ({ prevDetails, nextDetails }: Props) => {
  const { t } = useTranslation();
  const differences = useMemo(
    () => compareEnvironments(prevDetails, nextDetails),
    [prevDetails, nextDetails],
  );
  const labels = {
    base_info: t("common.history_comparison.info"),
    server_list: "Server List",
    env_var_list: "Environment Variable List",
  };
  const items = differences.map(({ key, previous, next }) => ({
    key,
    label: labels[key],
    children: (
      <Edit
        isAutoHeight={differences.length === 1}
        activeKey={key}
        prevValue={JSON.stringify(previous, null, "\t")}
        nextValue={JSON.stringify(next, null, "\t")}
      />
    ),
  }));
  return (
    <div className={styles.container}>
      {items.length ? (
        <Collapse
          size="small"
          defaultActiveKey={ENVIRONMENT_SECTIONS}
          items={items}
          contentClassName={styles.collapseContentBox}
        />
      ) : (
        <Empty description={t("common.history_comparison.same")} />
      )}
    </div>
  );
};
export default ApisDiffJsonContent;
