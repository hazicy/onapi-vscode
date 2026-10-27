import styles from "./PublicParamsTable.module.css";
import { FC, memo, useMemo } from "react";
import { useTranslation } from "react-i18next";

import { Checkbox, Collapse, Input } from "@/shared/ui/base";

import cn from "classnames";
import { concat, filter, isEqual, map, size, trim } from "lodash-es";

import AppIcon from "@/shared/ui/AppIcon";
import { useSystemHeaders } from "@/shared/contexts/system-headers";
import { ApisBaseDataItem } from "@onapi/domain/requests/types/base";
import { DefaultRequestSystemHeaders } from "@onapi/domain/requests/types/request";
import { GlobalParamsHeaderItem } from "@onapi/domain/project/types/index";

import { RequestTableProps } from "../types";

type Props = Pick<
  RequestTableProps,
  | "globalParams"
  | "folderParams"
  | "paramsType"
  | "tabType"
  | "isSystem"
  | "columnSwitchConfig"
  | "kind"
>;

const PublicParamsTable: FC<Props> = memo(
  ({ globalParams = [], folderParams = [], paramsType, tabType, kind }) => {
    const { t } = useTranslation();
    const {
      http: systemRequestHeader,
      websocket: systemRequestHeaderWebSocket,
      onChange,
    } = useSystemHeaders();

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
      if (tabType === "header") {
        commonParameters = concat(
          commonParameters,
          map(
            isEqual(kind, "socketio")
              ? []
              : isEqual(kind, "websocket")
                ? (systemRequestHeaderWebSocket as GlobalParamsHeaderItem[])
                : (systemRequestHeader as GlobalParamsHeaderItem[]),
            (it) => ({
              ...it,
              type: "system",
            }),
          ),
        );
      }
      return filter(commonParameters, (item) => trim(item?.key) !== "") || [];
    }, [
      globalParams,
      folderParams,
      paramsType,
      tabType,
      kind,
      systemRequestHeader,
      systemRequestHeaderWebSocket,
    ]);
    const renderCheckbox = (text: number | undefined, rowData: any) => (
      <Checkbox
        onChange={(e) => {
          const systemHeader: DefaultRequestSystemHeaders[] = map(
            isEqual(kind, "websocket")
              ? systemRequestHeaderWebSocket
              : systemRequestHeader,
            (el) => {
              if (el?.key === rowData?.key) {
                return { ...el, is_checked: e?.target?.checked ? 1 : -1 };
              }
              return el;
            },
          );

          onChange?.(kind === "websocket" ? "websocket" : "http", systemHeader);
        }}
        disabled={rowData?.type !== "system" || !onChange}
        checked={text === 1}
      />
    );
    if (size(lastDataSource) <= 0) {
      return null;
    }
    return (
      <div className={styles.container}>
        {size(lastDataSource) > 0 && (
          <Collapse
            ghost
            expandIcon={(panelProps) => {
              return (
                <>
                  {panelProps.isActive ? (
                    <AppIcon icon="eye" />
                  ) : (
                    <AppIcon icon="eye-off" />
                  )}
                </>
              );
            }}
            className={cn(
              [styles.tableCollapse, styles.tableCollapsePublic].join(" "),
              styles.collapse,
            )}
            triggerClassName={styles.collapseTrigger}
            items={[
              {
                key: "description",
                label: `${t("common.request_table.inherited")}  ${size(lastDataSource)}`,
                children: (
                  <div className={styles.inheritedRows}>
                    {lastDataSource.map((row, index) => (
                      <div
                        className={styles.inheritedRow}
                        key={row.param_id || index}
                      >
                        {renderCheckbox(row.is_checked, row)}
                        <Input
                          readOnly
                          value={row.key || ""}
                          aria-label={t("common.request_table.param_name")}
                        />
                        <Input
                          readOnly
                          value={row.value || ""}
                          aria-label="value"
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
