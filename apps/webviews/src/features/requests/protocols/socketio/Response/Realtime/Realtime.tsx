import type { SocketIoDetailsData } from "@onapi/http-model/requests/types/socketio";
import styles from "../../SocketIoDebug.module.css";
import React, { useEffect, useMemo, useRef } from "react";
import { useTranslation } from "react-i18next";

import { Tag } from "@/shared/ui/base";

import { useSafeState } from "ahooks";
import { bufferToRaw } from "@onapi/http-model/utils/response-tools";
import {
  includes,
  isArray,
  isEqual,
  isObject,
  isString,
  map,
  size,
} from "lodash-es";

import Sending from "@/features/requests/editor/Sending";

import FlowResponse from "@/features/requests/response/FlowResponse/FlowResponse";
import ResizablePanels from "@/shared/components/ResizablePanels/ResizablePanels";
import ResponseResult from "@/features/requests/response/ResponseResult/ResponseResult";

import { Tooltip } from "@/shared/ui";
import Empty from "@/shared/ui/Empty";
import useApis from "@/features/requests/store/useApis";
import useWebSocketStore from "@/features/requests/store/useApis/websocket";
import { MessageItem } from "@onapi/http-model/requests/types/socketio";
import { hexToRGBA } from "@/shared/utils/common";

import useWebSocket from "../../useWebSocket";
import ExampleModal from "./ExampleModal";
import Header from "./Header";
import { getSendStr, handleSocketResponse, stringToColor } from "./utils";

interface Props {
  id: string;
  onChange: (value: any) => void;
  apiScreenDirection: any;
}

const Realtime: React.FC<Props> = ({ id, onChange, apiScreenDirection }) => {
  const { t } = useTranslation();
  const websocketConnectionPool = useWebSocketStore(
    (state) => state.websocketConnectionPool,
  );
  const { updatePool } = useWebSocket();
  const apisActiveKey = useApis((state) => state.apisActiveData.id);
  const value = useApis((state) => state.apisActiveData) as SocketIoDetailsData;
  const [mode, setMode] = useSafeState<any>("text");
  const [data, setData] = useSafeState<any>({});
  const [filterValue, setFilterValue] = useSafeState<string>("");
  const [filterType, setFilterType] = useSafeState<string>("all");
  const [isScrollAuto, setIsScrollAuto] = useSafeState<boolean>(true);
  const lastScrollTop = useRef<{ [k: string]: number } | undefined>(undefined);
  const resultRef = useRef<any>(null);
  const flowRef = useRef<any>(null);
  const exampleRef = useRef<any>(null);
  const panelProps = {
    defaultSize: 50,
    minSize: 5,
    collapsible: true,
    collapsedSize: 5,
  };
  const mapTips: any = {
    connect: "",
    disconnect: `${t("ws.response.disconnect")}`,
    error: "",
    send: "",
    message: "",
    listen: `${t("supplement.listening")}`,
    "listen-end": `${t("supplement.listen_end")}`,
  };

  const isJSONString = (str: string): boolean => {
    try {
      const parsed = JSON.parse(str);
      return isObject(parsed) && !isArray(parsed);
    } catch (err) {
      return false;
    }
  };

  const rawHandle = (data: any) => {
    let str = "";
    switch (data?.action) {
      case "connect":
        str = data?.message?.message;
        break;
      case "send":
        str = getSendStr(data?.message?.message?.data);
        break;
      case "listen":
        str = data?.message;
        break;
      case "listen-end":
        str = data?.message;
        break;
      case "send_ack":
        str = getSendStr(data?.message?.message?.data);
        break;
      default:
        str = data?.message?.message;
        break;
    }

    return str || "";
  };

  const calcContent = (params?: any, parseToJsonStr = false) => {
    try {
      const {
        action,
        message: { message },
      } = params || {};

      if (action === "message") {
        if (!isString(message) && message?.data?.type && message?.data?.data) {
          const bufferRaw = bufferToRaw(message?.data?.data, {});
          const { raw } = bufferRaw;
          const result = raw;

          if (isJSONString(result)) {
            return result;
          }

          if (parseToJsonStr) {
            return JSON.stringify(result);
          }

          return result;
        }

        return parseToJsonStr ? JSON.stringify(message) : String(message);
      } else {
        return rawHandle(params);
      }
    } catch (err) {
      return "";
    }
  };

  const resultRaw = useMemo(() => {
    return calcContent(data) || "";
  }, [data]);
  const renderTitle = (data: any) => {
    const { action } = data || {};

    return (
      <div
        style={{
          whiteSpace: "nowrap",
          maxWidth: "100%",
          textOverflow: "ellipsis",
          overflow: "hidden",
        }}
      >
        {mapTips[action]}
        {includes(["message", "send", "send_ack"], action) &&
          data?.message?.message?.event && (
            <Tag
              bordered={false}
              style={{
                marginLeft: 8,
                color: stringToColor(data?.message?.message?.event),
                background: hexToRGBA(
                  stringToColor(data?.message?.message?.event),
                  0.05,
                ),
              }}
            >
              {data?.message?.message?.event}
            </Tag>
          )}
        {includes(["listen", "listen-end"], action) ? (
          <Tag
            bordered={false}
            style={{
              marginLeft: 8,
              color: stringToColor(calcContent(data)),
              background: hexToRGBA(stringToColor(calcContent(data)), 0.05),
            }}
          >
            {calcContent(data)}
          </Tag>
        ) : (
          <>
            {!isEqual(data?.message?.fitForShow, "Monaco") &&
            isEqual(data?.action, "message")
              ? "<Binary>"
              : calcContent(data)}
          </>
        )}
      </div>
    );
  };

  const wsTemplateStateList = useMemo(() => {
    return handleSocketResponse(
      websocketConnectionPool[apisActiveKey]?.socketRes,
      filterValue,
      filterType,
    );
  }, [websocketConnectionPool, apisActiveKey, filterValue, filterType]);

  const DropdownItems = useMemo(() => {
    return map(value?.message, (item: MessageItem) => ({
      label: (
        <div className={styles.exampleLabel}>
          <span className={styles.name}>
            <Tooltip title={item.name}>{item.name}</Tooltip>
          </span>
        </div>
      ),
      key: item.param_id,
    }));
  }, [value]);

  const customTipsContent = (data: any) => {
    if (isString(data?.message)) {
      return {};
    }

    return {
      size: data?.message?.size,
      time: data?.message?.time,
      mode: data?.message?.dataType,
    };
  };
  useEffect(() => {
    if (
      !isEqual(data?.message?.fitForShow, "Monaco") &&
      isEqual(data?.action, "message")
    ) {
      resultRef?.current?.setTabsValue("preview");
    } else {
      resultRef?.current?.setTabsValue("beautify");
    }
  }, [data]);

  useEffect(() => {
    const scroll = flowRef?.current && isScrollAuto;
    if (scroll) {
      flowRef.current.scrollTop = flowRef?.current?.scrollHeight || 0;
    }
  }, [apisActiveKey, isScrollAuto, wsTemplateStateList]);
  useEffect(() => {
    flowRef.current?.addEventListener("scroll", () => {
      if (!lastScrollTop.current) {
        lastScrollTop.current = {
          [apisActiveKey]: 0,
        };
      }
      const currentScrollTop = flowRef.current.scrollTop;
      if (currentScrollTop < lastScrollTop.current[apisActiveKey]) {
        setIsScrollAuto(false);
      }
      lastScrollTop.current[apisActiveKey] = currentScrollTop;
    });
    const currentFlowRef = flowRef.current;

    return () => {
      // Use local variable to remove event listener
      currentFlowRef?.removeEventListener("scroll", () => {});
    };
  }, [apisActiveKey]);
  useEffect(() => {
    if (wsTemplateStateList[size(wsTemplateStateList) - 1]?.action === "send") {
      setIsScrollAuto(true);
    }
  }, [wsTemplateStateList]);

  return (
    <>
      {websocketConnectionPool[apisActiveKey]?.status === "connecting" && (
        <Sending
          onCancel={() => {
            // Disconnect
            window?.vscode.postMessage({
              action: "socketio_disconnect",
              data: id,
            });
            updatePool(id, "disconnect", {});
          }}
        />
      )}

      <div
        style={{
          height: "100%",
        }}
      >
        {size(wsTemplateStateList) > -1 ? (
          <ResizablePanels
            panelGroupProps={{
              autoSaveId: "ws_realtime_container_resize_save_id",
              direction:
                apiScreenDirection === "horizontal" ? "vertical" : "horizontal",
            }}
            leftPanelProps={{
              ...panelProps,
              collapseTitle: t("supplement.socket_realtime_msg"),
            }}
            rightPanelProps={{
              ...panelProps,
              collapseTitle: t("supplement.socket_realtime_content"),
            }}
            leftPanel={
              <div className={styles.socketIoLeftPanel}>
                <Header
                  id={apisActiveKey}
                  filterValue={filterValue}
                  filterType={filterType}
                  setFilterType={setFilterType}
                  setFilterValue={setFilterValue}
                />
                <div
                  ref={flowRef}
                  style={{
                    overflow: "auto",
                    maxHeight: "calc(100% - 50px)",
                    border: "1px solid var(--color-border)",
                    borderRadius: "var(--border-radius)",
                  }}
                >
                  <FlowResponse
                    renderTitle={renderTitle}
                    customTipsContent={customTipsContent}
                    onItemClick={(item: any) => {
                      setData(item);
                    }}
                    data={wsTemplateStateList}
                  />
                </div>
              </div>
            }
            rightPanel={
              <div style={{ height: "100%", padding: 8 }}>
                {isEqual(data?.action, "message") && (
                  <ResponseResult
                    ref={resultRef}
                    data={
                      {
                        ...data,
                        fit_for_show: data?.message?.fitForShow,
                        stream: data?.message?.message?.data,
                        mime_type: { ext: data?.message?.dataType, mime: "" },
                      } as any
                    }
                    setMode={setMode}
                    resultIncludesTabs={["beautify", "native", "preview"]}
                    warpVisible={false}
                    rawHtml={resultRaw}
                  />
                )}
                {!isEqual(data?.action, "message") && (
                  <ResponseResult
                    ref={resultRef}
                    setMode={setMode}
                    resultIncludesTabs={["beautify", "native"]}
                    warpVisible={false}
                    rawHtml={resultRaw}
                  />
                )}
              </div>
            }
          />
        ) : (
          <Empty />
        )}
      </div>
      <ExampleModal
        data={value}
        mode={mode}
        rawHtml={resultRaw}
        onChange={onChange}
        ref={exampleRef}
      />
    </>
  );
};

export default Realtime;
