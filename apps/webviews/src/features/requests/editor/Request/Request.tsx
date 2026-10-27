import BodyModeSelect, { getBodyModeLabel } from "./Body/BodyModeSelect";
import classNames from "classnames";
import { HttpParameterTable } from "@/shared/components/RequestTable/RequestTable";
import {
  urlWithQuery,
  editedUrl,
  type HttpRequest,
  requestUrl,
} from "@onapi/http-model";
import styles from "./Request.module.css";
import type { TabPaneProps } from "@/shared/ui/base";
import React, { type FC, lazy, type ReactNode, useMemo, useState } from "react";
import type {
  SdkParameter,
  EditedSdkParameter,
} from "@/shared/components/RequestTable/sdk";
import type { HttpParameterTableProps } from "@/shared/components/RequestTable/RequestTable";
import type { RequestProps } from "./types";
import { compact, concat, head, map, size } from "lodash";
import LineTabs from "@/shared/components/LineTabs/LineTabs";
import SuspenseContent from "@/shared/components/SuspenseContent";
import { useTranslation } from "react-i18next";
const RequestScripts = lazy(() => import("./RequestScripts"));
const RequestBody = lazy(() => import("./Body/Body"));
const RequestAuth = lazy(() => import("./Auth/Auth"));

const Request: FC<RequestProps> = ({
  tabOptions = {},
  requestData,
  apiData,
  onRequestDataChange,
  onItemChange,
  includesTabs,
  extra = [],
  tabBarExtraContent,
}) => {
  const { t } = useTranslation();
  const [visitedTabs, setVisitedTabs] = useState<Set<string>>(
    () =>
      new Set([
        tabOptions.activeKey ||
          tabOptions.defaultActiveKey ||
          head(includesTabs) ||
          "Headers",
      ]),
  );
  const request = requestData;
  const storedUrl = typeof request.url === "object" ? request.url : undefined;
  const parsedUrl = editedUrl(requestUrl({ request }), storedUrl);
  const url = {
    ...parsedUrl,
    ...storedUrl,
    query: Array.isArray(storedUrl?.query) ? storedUrl.query : parsedUrl.query,
  };
  const write = <K extends keyof HttpRequest>(key: K, value: HttpRequest[K]) =>
    onRequestDataChange({ ...request, [key]: value });
  const parameterTable = (
    rows: SdkParameter[] | undefined,
    update: (rows: EditedSdkParameter[]) => void,
    tabType: HttpParameterTableProps["tabType"],
    bodyMode?: import("@onapi/http-model/requests/types/request").RequestBodyContentType,
  ) => (
    <HttpParameterTable
      dataSource={rows || []}
      onChange={update}
      tabType={tabType}
      bodyMode={bodyMode}
    />
  );
  const requestItems = [
    {
      key: "Headers",
      label: "Headers",
      children: parameterTable(
        request.header,
        (rows) =>
          write(
            "header",
            rows.map((row) => ({ ...row, value: row.value ?? undefined })),
          ),
        "header",
      ),
    },
    {
      key: "Params",
      label: "Params",
      children: parameterTable(
        url.query,
        (rows) => write("url", urlWithQuery(request.url, rows)),
        "query",
      ),
    },
    {
      key: "Path",
      label: "Path",
      children: parameterTable(
        url.variable,
        (rows) => write("url", { ...url, variable: rows }),
        "restful",
      ),
    },
    {
      key: "Body",
      label: getBodyModeLabel({
        value: request.body,
        onChange: write,
      }),
      tabExtra: (
        <BodyModeSelect iconOnly value={request.body} onChange={write} />
      ),
      children: (
        <RequestBody
          hideModeSelect
          apiData={apiData}
          value={request.body}
          onChange={write}
        />
      ),
    },
    {
      key: "Auth",
      label: t("api.run.auth"),
      children: <RequestAuth value={request.auth} onChange={write} />,
    },
    {
      key: "Cookie",
      label: "Cookie",
      children: parameterTable(
        (request.header || []).filter(
          (row) => row.key?.toLowerCase() === "cookie",
        ),
        (rows) =>
          write("header", [
            ...(request.header || []).filter(
              (row) => row.key?.toLowerCase() !== "cookie",
            ),
            ...rows.map((row) => ({ ...row, value: row.value ?? undefined })),
          ]),
        "cookie",
      ),
    },
    ...["prerequest", "test"].map((listen, index) => ({
      key: index ? "postResponse" : "preRequest",
      label: t(index ? "common.post_task" : "common.pre_task"),
      children: (
        <RequestScripts
          listen={listen}
          events={apiData.event || []}
          onChange={(event) => onItemChange?.({ ...apiData, event })}
        />
      ),
    })),
  ];
  const originItems: Array<
    TabPaneProps & { countParams?: any; key: string; label: ReactNode }
  > = requestItems.map((item) => ({
    ...item,
    countParams:
      item.key === "Headers"
        ? {
            dataSource: request.header?.filter((row) => !row.disabled),
          }
        : item.key === "Params"
          ? {
              dataSource: url.query?.filter((row) => !row.disabled),
            }
          : item.key === "Path"
            ? { dataSource: url.variable }
            : undefined,
  }));
  const tabsItems = useMemo(() => {
    const _originItems = map(originItems, (item) => ({
      ...item,
      children: (
        <SuspenseContent>
          {visitedTabs.has(item.key) || tabOptions.activeKey === item.key
            ? item.children
            : null}
        </SuspenseContent>
      ) as React.ReactNode,
    }));

    const mergeItems = concat([], _originItems, extra);
    const finalItems =
      size(includesTabs) > 0
        ? compact(
            map(includesTabs, (key: string) =>
              mergeItems?.find((item) => item.key === key),
            ),
          )
        : _originItems;

    return finalItems;
  }, [originItems, extra, includesTabs, visitedTabs, tabOptions.activeKey]);

  return (
    <div className={styles.container}>
      <LineTabs
        items={tabsItems}
        tabBarExtraContent={tabBarExtraContent}
        defaultActiveKey={tabOptions?.defaultActiveKey || head(tabsItems)?.key}
        {...tabOptions}
        onChange={(key) => {
          setVisitedTabs((previous) => new Set([...previous, key]));
          tabOptions.onChange?.(key);
        }}
        navClassName={styles.tabsNav}
        panelClassName={styles.tabsTabpane}
        panelsClassName={styles.tabsContent}
        className={classNames(styles.tabs, styles.tabsTop)}
      />
    </div>
  );
};

export default Request;
