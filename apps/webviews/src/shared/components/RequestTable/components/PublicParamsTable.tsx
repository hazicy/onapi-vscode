import styles from "./PublicParamsTable.module.css";
import { FC, memo, useMemo } from "react";
import { useTranslation } from "react-i18next";

import { Checkbox, Collapse, Input } from "@/shared/ui/base";

import cn from "classnames";
import { concat, filter, isEqual, map, size, trim } from "lodash-es";

import AppIcon from "@/shared/ui/AppIcon";
import useSystemConfig from "@/features/settings/store/useSystemConfig";
import { ApisBaseDataItem } from "@onapi/http-model/requests/types/base";
import { DefaultRequestSystemHeaders } from "@onapi/http-model/requests/types/request";
import { GlobalParamsHeaderItem } from "@onapi/http-model/project/types/index";

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
    const systemConfig = useSystemConfig((state) => state.systemConfig);
    const systemRequestHeader = systemConfig?.systemRequestHeader || [];
    const systemRequestHeaderWebSocket =
      systemConfig?.systemRequestHeaderWebSocket || [];

    const updateSystemConfig = useSystemConfig(
      (state) => state.updateSystemConfig,
    );

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
    }, [globalParams, folderParams, paramsType, systemRequestHeader]);
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

          isEqual(kind, "websocket")
            ? updateSystemConfig({
                ...systemConfig,
                systemRequestHeaderWebSocket: systemHeader,
              })
            : updateSystemConfig({
                ...systemConfig,
                systemRequestHeader: systemHeader,
              });

          window?.vscode.postMessage({
            action: "setSystemConfig",
            data: { systemRequestHeader: systemHeader },
          });
        }}
        disabled={rowData?.type !== "system"}
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
