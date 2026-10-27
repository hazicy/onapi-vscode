import { selectRequestIndex } from "@/features/requests/store/useApis";
import React, { useEffect } from "react";
import { useTranslation } from "react-i18next";

import { useDebounceFn, useSafeState } from "ahooks";
import { concat, forEach, isEqual, keys, reverse } from "lodash-es";

import LineTabs from "@/shared/components/LineTabs/LineTabs";
import context from "@/shared/components/RawEditor/visualizationContext";
import RequestTable from "@/shared/components/RequestTable/RequestTable";
import useTableColumnSwitchConfig from "@/features/settings/hooks/useTableColumnSwitchConfig";

import useApis from "@/features/requests/store/useApis";
import useProjectConfig from "@/features/project/store/useProjectConfig";
import useWebSocketStore from "@/features/requests/store/useApis/websocket";
import { ApisBaseDataItem } from "@onapi/domain/requests/types/base";
import { SocketIoDetailsData } from "@onapi/domain/requests/types/socketio";
import { genUrlByQuery } from "@/features/requests/utils/apis";
import {
  calcTabLineBodyHeaderNum,
  getAllParentDirectories,
} from "@/shared/utils/common";

import useWebSocket from "../useWebSocket";
import Message from "./Message";
import Setting from "./Setting";

interface Props {
  value: any;
  readOnly?: boolean;
  onChange: (data: SocketIoDetailsData) => void;
}
const Request: React.FC<Props> = (props) => {
  const { value, onChange, readOnly } = props || {};
  const { Provider } = context;
  const { request } = value || {};
  const apisActiveKey = useApis((state) => state.apisActiveData.id);
  const apiDetailsData = useApis(selectRequestIndex);
  const globalParams = useProjectConfig((state) => state.globalParams);
  const websocketConnectionPool = useWebSocketStore(
    (state) => state.websocketConnectionPool,
  );
  const [allParentDirectories, setAllParentDirectories] = useSafeState<{
    [k: string]: ApisBaseDataItem[];
  }>({});
  const { updatePool } = useWebSocket();
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

  const { run: sendSocketIoEventHandle } = useDebounceFn(
    (data: ApisBaseDataItem[]) => {
      window?.vscode.postMessage({
        action: "socketio_update_event",
        data: {
          id: apisActiveKey,
          parameter: data,
        },
      });
    },
    {
      wait: 500,
    },
  );
  const handleRequest = (data: ApisBaseDataItem[], type: string) => {
    if (isEqual(type, "event")) {
      if (
        isEqual(websocketConnectionPool?.[apisActiveKey]?.status, "connect")
      ) {
        sendSocketIoEventHandle(data);
      }
    }
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
      key: "event",
      label: t("ws.request.events"),
      children: (
        <RequestTable
          tabType={"socketio"}
          dataSource={request?.event?.parameter}
          onChange={(data: ApisBaseDataItem[]) => handleRequest(data, "event")}
        />
      ),
      countParams: {
        dataSource: request?.event?.parameter,
        customCalcFun: calcTabLineBodyHeaderNum,
      },
    },
    {
      key: "header",
      label: t("ws.request.headers"),
      children: (
        <RequestTable
          kind="socketio"
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
          tabType="query"
          globalParams={globalParams?.query?.parameter}
          folderParams={allParentDirectories?.query}
          readOnly={readOnly}
          dataSource={request?.query?.parameter}
          onChange={(data: ApisBaseDataItem[]) => handleRequest(data, "query")}
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
          tabType="cookie"
          globalParams={globalParams?.cookie?.parameter}
          folderParams={allParentDirectories?.cookie}
          readOnly={readOnly}
          dataSource={request?.cookie?.parameter}
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
