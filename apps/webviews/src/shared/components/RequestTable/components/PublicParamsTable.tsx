import styles from "./PublicParamsTable.module.css";
import { FC, memo, useMemo } from "react";
import { useTranslation } from "react-i18next";

import { Checkbox, Collapse, Input } from "@/shared/ui/base";

import clsx from "clsx";
import { concat, filter, map, size, trim } from "lodash-es";

import AppIcon from "@/shared/ui/AppIcon";
import { ApisBaseDataItem } from "@onapi/domain/requests/types/base";
import { GlobalParamsHeaderItem } from "@onapi/domain/project/types/index";

import { RequestTableProps } from "../types";

type Props = Pick<
  RequestTableProps,
  "globalParams" | "folderParams" | "paramsType" | "tabType"
>;

const PublicParamsTable: FC<Props> = memo(
  ({ globalParams = [], folderParams = [], paramsType, tabType }) => {
    const { t } = useTranslation();
    const lastDataSource = useMemo(() => {
      let commonParameters: (GlobalParamsHeaderItem | ApisBaseDataItem)[] = [];

      const newGlobalParams = map(globalParams, (it) => ({
        ...it,
        type: "global",
      }));
      const newFolderParams = map(folderParams, (it) => ({
        ...it,
        type: "folder",
      }));

      if (paramsType !== "global") {
        commonParameters = concat(commonParameters, newGlobalParams);
      }

      commonParameters = concat(commonParameters, newFolderParams);
      return filter(commonParameters, (item) => trim(item?.key) !== "") || [];
    }, [globalParams, folderParams, paramsType]);
    const renderCheckbox = (text: number | undefined) => (
      <Checkbox disabled checked={text === 1} />
    );
    if (size(lastDataSource) <= 0) {
      return null;
    }
    return (
      <div className={styles.container}>
        {size(lastDataSource) > 0 && (
          <Collapse
            ghost
            defaultActiveKey={[]}
            expandIconPosition="end"
            className={clsx(
              [styles.tableCollapse, styles.tableCollapsePublic].join(" "),
              styles.collapse,
            )}
            triggerClassName={styles.collapseTrigger}
            items={[
              {
                key: "description",
                label: (
                  <span className={styles.summary}>
                    <AppIcon icon="layers" />
                    {t("request_panel.inherited_parameters", {
                      name:
                        tabType === "header"
                          ? t("request_fields.headers")
                          : tabType === "cookie"
                            ? "Cookie"
                            : t("request_fields.query"),
                    })}
                    <span className={styles.count}>{size(lastDataSource)}</span>
                  </span>
                ),
                children: (
                  <div className={styles.inheritedRows}>
                    {lastDataSource.map((row, index) => (
                      <div
                        className={styles.inheritedRow}
                        key={row.param_id || index}
                      >
                        {renderCheckbox(row.is_checked)}
                        <Input
                          readOnly
                          value={row.key || ""}
                          aria-label={t("common.request_table.param_name")}
                        />
                        <Input
                          readOnly
                          value={row.value || ""}
                          aria-label={t("ui.parameter_value")}
                        />
                      </div>
                    ))}
                  </div>
                ),
              },
            ]}
            panelClassName={styles.collapseContent}
            contentClassName={styles.collapseContentBox}
            headerClassName={styles.collapseHeader}
            itemClassName={styles.collapseItem}
          />
        )}
      </div>
    );
  },
);

export default PublicParamsTable;
