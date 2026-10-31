import { sendRequestPanelMessage } from "@/shared/bridge/request-panel";
import type { SocketIoDetailsData } from "@onapi/domain/requests/types/socketio";
import styles from "../../SocketIoDebug.module.css";
import React, { useEffect, useMemo, useRef } from "react";
import { useTranslation } from "react-i18next";

import { Tag } from "@/shared/ui/base";

import { useSafeState } from "ahooks";
import { bufferToRaw } from "@onapi/domain/utils/response-tools";
import {
  includes,
  isArray,
  isEqual,
  isObject,
  isString,
  size,
} from "lodash-es";

import Sending from "@/features/requests/editor/Sending";

import FlowResponse from "@/features/requests/response/FlowResponse/FlowResponse";
import { SocketTimeline } from "../../../shared/SocketPanels";
import ResponseResult from "@/features/requests/response/ResponseResult/ResponseResult";

import Empty from "../../../websocket/Response/Empty";
import Button from "@/shared/ui/Button";
import useApis from "@/features/requests/store/useApis";
import useWebSocketStore from "@/features/requests/store/useApis/websocket";

import { hexToRGBA } from "@/shared/utils/common";

import useWebSocket from "../../useWebSocket";
import ExampleModal from "./ExampleModal";
import Header from "./Header";
import { getSendStr, handleSocketResponse, stringToColor } from "./utils";

interface Props {
  id: string;
  onChange: (value: any) => void;
}

const Realtime: React.FC<Props> = ({ id, onChange }) => {
  const { t } = useTranslation();
  const websocketConnectionPool = useWebSocketStore(
    (state) => state.websocketConnectionPool,
  );
  const { updatePool } = useWebSocket();
  const apisActiveKey = id;
  const value = useApis((state) => state.apisActiveData) as SocketIoDetailsData;
  const [mode, setMode] = useSafeState<any>("text");
  const [data, setData] = useSafeState<any>({});
  useEffect(() => {
    setData({});
  }, [apisActiveKey, setData]);
  const [filterValue, setFilterValue] = useSafeState<string>("");
  const [filterType, setFilterType] = useSafeState<string>("all");
  const [isScrollAuto, setIsScrollAuto] = useSafeState<boolean>(true);
  const lastScrollTop = useRef<{ [k: string]: number } | undefined>(undefined);
  const resultRef = useRef<any>(null);
  const flowRef = useRef<any>(null);
  const exampleRef = useRef<any>(null);
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

  const messages = websocketConnectionPool[apisActiveKey]?.socketRes;
  const connected =
    websocketConnectionPool[apisActiveKey]?.status === "connect";
  const hasFilter = Boolean(filterValue.trim() || filterType !== "all");
  useEffect(() => {
    if (!messages?.length) {
      setData({});
    }
  }, [messages, setData]);
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
    const element = flowRef.current;
    if (!element) {
      return;
    }
    const handleScroll = () => {
      if (!lastScrollTop.current) {
        lastScrollTop.current = {};
      }
      const currentScrollTop = element.scrollTop;
      if (currentScrollTop < (lastScrollTop.current[apisActiveKey] || 0)) {
        setIsScrollAuto(false);
      }
      lastScrollTop.current[apisActiveKey] = currentScrollTop;
    };
    element.addEventListener("scroll", handleScroll);
    return () => element.removeEventListener("scroll", handleScroll);
  }, [apisActiveKey, setIsScrollAuto]);
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
            sendRequestPanelMessage({
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
          <SocketTimeline
            selected={Boolean(data?.action)}
            onClose={() => setData({})}
            list={
              <div className={styles.socketIoLeftPanel}>
                <Header
                  id={apisActiveKey}
                  filterValue={filterValue}
                  filterType={filterType}
                  setFilterType={setFilterType}
                  setFilterValue={setFilterValue}
                />
                <div ref={flowRef} className={styles.messageList}>
                  {!wsTemplateStateList.length ? (
                    <Empty
                      description={
                        hasFilter
                          ? t("ws.response.filter_hint")
                          : connected
                            ? t("ws.response.ready_description")
                            : t("ws.response.empty_description")
                      }
                    >
                      {hasFilter && (
                        <Button
                          type="text"
                          size="small"
                          onClick={() => {
                            setFilterValue("");
                            setFilterType("all");
                          }}
                        >
                          {t("ws.response.reset_filters")}
                        </Button>
                      )}
                    </Empty>
                  ) : (
                    <FlowResponse
                      autoSelectFirst={false}
                      compact
                      renderTitle={renderTitle}
                      customTipsContent={customTipsContent}
                      onItemClick={(item: any) => {
                        setData(item);
                      }}
                      data={wsTemplateStateList}
                    />
                  )}
                </div>
              </div>
            }
            detail={
              <div style={{ height: "100%", minHeight: 0 }}>
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
