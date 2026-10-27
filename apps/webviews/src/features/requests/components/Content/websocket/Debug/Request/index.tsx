import { selectRequestIndex } from "@/features/requests/store/useApis";
import React, { useEffect } from "react";
import { useTranslation } from "react-i18next";

import { useSafeState } from "ahooks";
import { concat, forEach, isEqual, keys, reverse } from "lodash";

import LineTabs from "@/shared/components/LineTabs";
import context from "@/shared/components/RawEditor/visualizationContext";
import RequestTable from "@/shared/components/RequestTable";
import { useTableColumnSwitchConfig } from "@/shared/hooks";

import useApis from "@/features/requests/store/useApis";
import useProjectConfig from "@/features/project/store/useProjectConfig";
import { ApisBaseDataItem } from "@onapi/http-model/requests/types/base";
import { WebSocketDetailsData } from "@onapi/http-model/requests/types/websocket";
import {
  calcTabLineBodyHeaderNum,
  getAllParentDirectories,
} from "@/shared/utils/common";

import Message from "./Message";
import Setting from "./Setting";
import { genUrlByQuery } from "@/features/requests/utils/apis";

interface Props {
  value: any;
  readOnly?: boolean;
  onChange: (data: WebSocketDetailsData) => void;
}
const Request: React.FC<Props> = (props) => {
  const { value, onChange, readOnly } = props || {};
  const { Provider } = context;
  const { request } = value || {};
  const apiDetailsData = useApis(selectRequestIndex);
  const globalParams = useProjectConfig((state) => state.globalParams);

  const [allParentDirectories, setAllParentDirectories] = useSafeState<{
    [k: string]: ApisBaseDataItem[];
  }>({});
  const { t } = useTranslation();

  const {
    columnSwitchConfig: headerColumnSwitchConfig,
    onColumnSwitchConfig: onHeaderColumnSwitchConfig,
  } = useTableColumnSwitchConfig("request_header_column_switch");

  const {
    columnSwitchConfig: queryColumnSwitchConfig,
    onColumnSwitchConfig: onQueryColumnSwitchConfig,
  } = useTableColumnSwitchConfig("request_query_column_switch");

  const {
    columnSwitchConfig: cookieColumnSwitchConfig,
    onColumnSwitchConfig: onCookieColumnSwitchConfig,
  } = useTableColumnSwitchConfig("request_cookie_column_switch");

  const handleRequest = (data: ApisBaseDataItem[], type: string) => {
    onChange({
      ...value,
      url: isEqual(type, "query") ? genUrlByQuery(value.url, data) : value.url,
      request: {
        ...value.request,
        [type]: {
          parameter: data,
        },
      },
    });
  };
  const handleRequestConfig = (data: any) => {
    onChange({ ...value, config: { ...data } });
  };
  useEffect(() => {
    const allParentFolder = getAllParentDirectories(
      apiDetailsData,
      value?.id || "",
    );
    const reverseFolder = reverse(allParentFolder);

    const folderParams: { [k: string]: ApisBaseDataItem[] } = {
      header: [],
      query: [],
      body: [],
      restful: [],
      cookie: [],
    };

    forEach(reverseFolder, (item: any) => {
      const { request } = item || {};

      if (!request) {
        return;
      }

      forEach(keys(folderParams), (key) => {
        if (request[key]) {
          folderParams[key] = concat(
            [],
            folderParams[key],
            request[key]?.parameter?.map((e: any) => ({
              ...e,
              id: item?.id,
            })), // Associate id for global parameter navigation
          );
        }
      });
    });

    setAllParentDirectories(folderParams);
  }, [value?.id, apiDetailsData]);
  const items = [
    {
      key: "send",
      label: t("ws.request.message"),
      children: (
        <Provider
          value={{
            isDebugArea: true,
          }}
        >
          <Message value={value} onChange={onChange} />
        </Provider>
      ),
    },
    {
      key: "header",
      label: t("ws.request.headers"),
      children: (
        <RequestTable
          kind="websocket"
          tabType="header"
          globalParams={globalParams?.header?.parameter}
          folderParams={allParentDirectories?.header}
          readOnly={readOnly}
          dataSource={request?.header?.parameter}
          onChange={(data) => handleRequest(data, "header")}
          columnSwitchConfig={headerColumnSwitchConfig}
          onColumnSwitchConfig={onHeaderColumnSwitchConfig}
        />
      ),
      countParams: {
        dataSource: request?.header?.parameter,
        customCalcFun: calcTabLineBodyHeaderNum,
      },
    },
    {
      key: "params",
      label: t("ws.request.params"),
      children: (
        <RequestTable
          readOnly={readOnly}
          dataSource={request?.query?.parameter}
          onChange={(data: ApisBaseDataItem[]) => handleRequest(data, "query")}
          folderParams={allParentDirectories?.query}
          columnSwitchConfig={queryColumnSwitchConfig}
          onColumnSwitchConfig={onQueryColumnSwitchConfig}
        />
      ),
      countParams: {
        dataSource: request?.query?.parameter,
        customCalcFun: calcTabLineBodyHeaderNum,
      },
    },
    {
      key: "cookie",
      label: "Cookie",
      children: (
        <RequestTable
          readOnly={readOnly}
          dataSource={request?.cookie?.parameter}
          folderParams={allParentDirectories?.cookie}
          onChange={(data: ApisBaseDataItem[]) => handleRequest(data, "cookie")}
          columnSwitchConfig={cookieColumnSwitchConfig}
          onColumnSwitchConfig={onCookieColumnSwitchConfig}
        />
      ),
      countParams: {
        dataSource: request?.cookie?.parameter,
        customCalcFun: calcTabLineBodyHeaderNum,
      },
    },
    {
      key: "setting",
      label: t("ws.request.settings"),
      children: (
        <Setting
          readOnly={readOnly}
          onChange={handleRequestConfig}
          value={value?.config}
        />
      ),
    },
  ];

  return <LineTabs items={items} />;
};

export default Request;
