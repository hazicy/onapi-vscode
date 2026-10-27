import styles from "./ApisDiffJsonContent.module.css";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import { Collapse } from "@/shared/ui/base";

import { forEach, size } from "lodash-es";

import { Empty } from "@/shared/ui";

import Edit from "./Edit";
import useFormat from "./hooks";

import { EnvListItem } from "@onapi/domain/environment/types/index";

interface Props {
  prevDetails: EnvListItem;
  nextDetails: EnvListItem;
}

const ApisDiffJsonContent = (props: Props) => {
  const { t } = useTranslation();
  const { prevDetails, nextDetails } = props || {};
  const mapJson: { [k: string]: string } = useMemo(() => {
    return {
      base_info: t("common.history_comparison.info"),
      server_list: `Server List`,
      env_var_list: `Environment Variable List`,
    };
  }, [t]);

  const { envs }: any = useFormat({
    oldData: prevDetails,
    newData: nextDetails,
    targetType: "env",
  });
  const mapTypeJson: { [k: string]: any } = {
    envs: mapJson,
  };

  const renderList = useMemo(() => {
    const dataSource = envs || {};

    const collapseLabelMap = mapTypeJson.envs || {};
    const list: any = [];
    let count = 0;
    forEach(Object.keys(dataSource), (key) => {
      if (dataSource[key][`${key}_diff`]) {
        count++;
      }
    });

    forEach(Object.keys(dataSource), (key) => {
      if (dataSource[key][`${key}_diff`]) {
        list.push({
          key: key,
          label: collapseLabelMap[key],
          children: (
            <Edit
              isAutoHeight={count === 1}
              key={key}
              activeKey={key}
              prevValue={JSON.stringify(
                dataSource[key][`prev_${key}`],
                null,
                "\t",
              )}
              nextValue={JSON.stringify(
                dataSource[key][`next_${key}`],
                null,
                "\t",
              )}
            />
          ),
        });
      }
    });
    return list;
  }, [envs]);
  if (size(renderList) === 0) {
    return (
      <div className={styles.container}>
        <Empty description={t("common.history_comparison.same")} />
      </div>
    );
  }
  return (
    <div className={styles.container}>
      <Collapse
        size="small"
        defaultActiveKey={[
          "base_info",
          "description",
          "header",
          "query",
          "event",
          "restful",
          "cookie",
          "auth",
          "pre_tasks",
          "post_tasks",
          "response",
          "message",
          "body",
          "server_list",
          "env_var_list",
        ]}
        items={renderList}
        contentClassName={styles.collapseContentBox}
      />
    </div>
  );
};

export default ApisDiffJsonContent;
