import classNames from "classnames";
import styles from "../../WebSocketDebug.module.css";
import React, { useEffect, useMemo, useRef } from "react";
import { useTranslation } from "react-i18next";

import { Dropdown } from "@/shared/ui/base";

import { useSafeState } from "ahooks";
import { cloneDeep, isEqual, isFunction, isString, map, size } from "lodash-es";

import Sending from "@/features/requests/editor/Sending";

import FlowResponse from "@/features/requests/response/FlowResponse/FlowResponse";
import ResizablePanels from "@/shared/components/ResizablePanels/ResizablePanels";
import ResponseResult from "@/features/requests/response/ResponseResult/ResponseResult";

import { AppIcon, Tooltip } from "@/shared/ui";
import Empty from "../Empty";
import Button from "@/shared/ui/Button";
import useApis from "@/features/requests/store/useApis";
import useWebSocketStore from "@/features/requests/store/useApis/websocket";
import { MessageItem } from "@onapi/domain/requests/types/websocket";

import useWebSocket from "../../useWebSocket";
import Header from "./Header";
import { getSocketContent, handleSocketResponse } from "./utils";

interface Props {
  value: any;
  onChange: (value: any) => void;
}

const Realtime: React.FC<Props> = ({ value, onChange }) => {
  const { t } = useTranslation();
  const websocketConnectionPool = useWebSocketStore(
    (state) => state.websocketConnectionPool,
  );
  const { updatePool } = useWebSocket();
  const apisActiveData = useApis((state) => state.apisActiveData);
  const apisActiveKey = apisActiveData.id;

  const [mode, setMode] = useSafeState<any>("text");
  const [data, setData] = useSafeState<any>({});
  const [filterValue, setFilterValue] = useSafeState<string>("");
  const [filterType, setFilterType] = useSafeState<string>("all");
  const [isScrollAuto, setIsScrollAuto] = useSafeState<boolean>(true);
  const lastScrollTop = useRef(0);
  const flowRef = useRef<HTMLDivElement>(null);
  const resultRef = useRef<any>(null);
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
  };

  const resultRaw = useMemo(() => {
    return getSocketContent(data);
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
        {getSocketContent(data)}
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
  const hasFilter = Boolean(filterValue || filterType !== "all");
  useEffect(() => {
    if (!messages?.length) {
      setData({});
    }
  }, [messages, setData]);
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

  const saveSocketMessageDom = (
    <Dropdown
      trigger={["click"]}
      dropdownRender={(menu) => {
        return (
          <div style={{ minWidth: 120 }} className={styles.exampleList}>
            {menu}
          </div>
        );
      }}
      menu={{
        items: DropdownItems,
        onClick: ({ key }) => {
          const newValue = cloneDeep(value);
          newValue?.message.forEach((item: MessageItem) => {
            if (item.param_id === key) {
              item.response.raw = resultRaw;
              item.response.mode = mode;
            }
          });
          onChange(newValue);
        },
      }}
      itemClassName={classNames(
        styles.dropdownMenuItem,
        styles.dropdownMenuSubmenu,
      )}
      overlayClassName={styles.dropdownMenu}
    >
      <Tooltip title={t("api.response_labels.save_response")}>
        <AppIcon icon="save" />
      </Tooltip>
    </Dropdown>
  );
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
    if (!isFunction(resultRef?.current?.setTabsValue)) {
      return;
    }
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
    const el = flowRef.current;
    if (el && isScrollAuto) {
      el.scrollTop = el.scrollHeight;
    }
  }, [isScrollAuto, wsTemplateStateList]);
  useEffect(() => {
    const el = flowRef.current;
    if (!el) {
      return;
    }
    const handleScroll = () => {
      const currentScrollTop = el.scrollTop;
      if (currentScrollTop < lastScrollTop.current) {
        setIsScrollAuto(false);
      }
      lastScrollTop.current = currentScrollTop;
    };
    el.addEventListener("scroll", handleScroll);
    return () => el.removeEventListener("scroll", handleScroll);
  }, [setIsScrollAuto]);
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
              action: "ws_disconnect",
              data: value?.id,
            });

            updatePool(value?.id, "disconnect", {});
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
              direction: "horizontal",
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
              <div className={styles.websocketLeftPanel}>
                <Header
                  id={apisActiveKey}
                  filterValue={filterValue}
                  filterType={filterType}
                  setFilterType={setFilterType}
                  setFilterValue={setFilterValue}
                />
                <div
                  ref={flowRef}
                  className={classNames("websocket", styles.messageList)}
                >
                  {!wsTemplateStateList.length ? (
                    <Empty
                      title={
                        hasFilter
                          ? t("ws.response.no_matches")
                          : t("ws.response.empty_title")
                      }
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
            rightPanel={
              <div style={{ height: "100%", padding: 8 }}>
                {!data?.action && (
                  <Empty
                    title={t("ws.response.select_title")}
                    description={t("ws.response.select_description")}
                  />
                )}
                {isEqual(data?.action, "message") && (
                  <ResponseResult
                    ref={resultRef}
                    data={
                      {
                        ...data,
                        fit_for_show: data?.message?.fitForShow,
                        stream: data?.message?.data,
                        mime_type: { ext: data?.message?.dataType, mime: "" },
                      } as any
                    }
                    setMode={setMode}
                    resultIncludesTabs={["beautify", "native", "preview"]}
                    warpVisible={false}
                    rawHtml={resultRaw}
                  />
                )}
                {data?.action && !isEqual(data?.action, "message") && (
                  <ResponseResult
                    ref={resultRef}
                    data={
                      {
                        ...data,
                        fit_for_show: data?.message?.fitForShow,
                        stream: data?.message?.data,
                        mime_type: { ext: data?.message?.dataType, mime: "" },
                      } as any
                    }
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
    </>
  );
};

export default Realtime;
