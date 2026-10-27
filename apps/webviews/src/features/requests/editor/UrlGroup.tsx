import classNames from "classnames";
import React, {
  KeyboardEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useTranslation } from "react-i18next";

import {
  Button,
  Divider,
  Input,
  Select,
  SelectProps,
  Space,
} from "@/shared/ui/base";

import { find, includes, isArray, isString } from "lodash-es";

import AppIcon from "@/shared/ui/AppIcon";
import Tooltip from "@/shared/ui/Tooltip";
import { PROTOCOL_OPTIONS } from "@onapi/http-model/requests/constants/index";
import { METHODS_MAP } from "@onapi/http-model/constants/common";
import useTheme from "@/shared/hooks/useTheme";
import { openEnvPage } from "@/features/requests/events/env";
import useApis from "@/features/requests/store/useApis";
import useProjectConfig from "@/features/project/store/useProjectConfig";

import VarInput from "../../variables/components/VarInput/VarInput";

import { getCollectionServerId } from "@/features/requests/utils/apis";
import { CurlDataType } from "@/features/requests/types/other";
import styles from "./UrlGroup.module.css";

export interface UrlGroupProps {
  envId?: string;
  type?: string;
  readOnly?: boolean;
  className?: string;
  style?: React.CSSProperties;
  data: {
    url?: string;
    method?: string;
    protocol?: string;
    service?: string;
    func?: string;
  };
  placeholder?: string;
  maxLength?: number;
  urlGroupExtraContent?: React.ReactNode;
  supportCurlImport?: boolean;
  onChange: (key: string, value: string) => void;
  onKeyDown?: (
    event: KeyboardEvent<HTMLDivElement>,
    isEnvOpen?: boolean,
  ) => void;
  curlChange?: (d: CurlDataType) => void;
  curServerId: string;
  SetCurServerId: (newId: string) => void;
  hideProtocol?: boolean;
  hideServer?: boolean;
}

type LabelRender = SelectProps["labelRender"];

const UrlGroup = (props: UrlGroupProps) => {
  const {
    envId,
    type = "api",
    data,
    readOnly = false,
    className = "",
    style = {},
    placeholder,
    maxLength,
    urlGroupExtraContent,
    onChange,
    onKeyDown,
    curServerId,
    SetCurServerId,
    hideProtocol = false,
    hideServer = false,
    supportCurlImport = false,
    curlChange,
  } = props || {};
  const { t } = useTranslation();
  const { themeToken } = useTheme();
  const envList = useProjectConfig((state) => state.envList);
  const envDetailKeys = useProjectConfig((state) => state.envDetailKeys);
  const apisActiveData = useApis((store) => store.apisActiveData);
  const apiOriginDetailsList = useApis((store) => store.apiOriginDetailsList);
  const updateCurrentServerId = useApis((state) => state.updateCurrentServerId);
  const customMethodList = useProjectConfig((state) => state?.customMethodList);

  const [methodSelectOpen, setMethodSelectOpen] = useState(false);
  const requestBarRef = useRef<HTMLDivElement>(null);

  const currentEnv = useMemo(() => {
    const env = envId || envDetailKeys;
    return find(envList, (it) => it?.env_id === env); // use passed environment id if available, otherwise use default
  }, [envList, envDetailKeys, envId]);

  const envUrl = useMemo(() => {
    if (isArray(currentEnv?.server_list)) {
      const defaultServer = currentEnv.server_list.find(
        (i) => i?.is_default === 1,
      );
      return defaultServer?.uri || "";
    }
    return "";
  }, [currentEnv]);

  useEffect(() => {
    const tempServerId = getCollectionServerId(
      apisActiveData?.id,
      apiOriginDetailsList.reduce((pre: any, cur) => {
        if (cur?.id) {
          pre[cur.id] = cur;
        }
        return pre;
      }, {}),
    );
    updateCurrentServerId(tempServerId);
    SetCurServerId(tempServerId);
  }, [apiOriginDetailsList]);

  const handleChange = (key: string, value: string) => {
    onChange(key, value);
  };

  const defaultServerId = useMemo(() => {
    if (isArray(currentEnv?.server_list)) {
      const defaultServerId =
        currentEnv.server_list.find((i) => i?.is_default === 1)?.server_id ||
        "";
      if (defaultServerId) {
        return defaultServerId;
      }
      return (
        currentEnv.server_list.find((i) => i?.server_id == "1")?.server_id || ""
      );
    }
    return "";
  }, [currentEnv]);

  const addServer = () => {
    openEnvPage({ env_id: currentEnv?.env_id });
  };

  const renderUri = (uri: string) => {
    if (uri.length <= 0) {
      return <span style={{ fontStyle: "italic" }}>null</span>;
    }
    return uri;
  };

  const optionRender: SelectProps["optionRender"] = (option) => {
    return (
      <div className={styles.optionsItem}>
        <span className={styles.label}>{option?.data?.label}</span>
        <span className={styles.uri}>{renderUri(option?.data?.uri || "")}</span>
      </div>
    );
  };

  const serverOptions = useMemo(() => {
    return currentEnv?.server_list?.map((item) => ({
      label: item.name,
      value: item.server_id,
      uri: item.uri,
    }));
  }, [currentEnv?.server_list]);

  const labelRender: LabelRender = (option) =>
    renderUri(
      serverOptions?.find((server) => server.value === option.value)?.uri || "",
    );

  const pasteCurlChange = (d: CurlDataType) => {
    if (supportCurlImport) {
      curlChange?.(d);
    }
  };

  return (
    <div
      ref={requestBarRef}
      style={style}
      className={classNames(styles.container, className)}
    >
      {["api", "sse"].includes(type) && (
        <>
          <Select
            bordered={false}
            open={methodSelectOpen}
            onDropdownVisibleChange={(open) => {
              setMethodSelectOpen(open);
            }}
            className={classNames(
              styles[data?.method?.toLowerCase() || "DEFAULT"],
              styles.select,
            )}
            disabled={readOnly}
            value={data?.method || METHODS_MAP[type][0]}
            suffixIcon={
              <AppIcon style={{ pointerEvents: "none" }} icon="chevron-down" />
            }
            size="small"
            placement="bottomLeft"
            popupArrow
            popupAnchor={requestBarRef}
            popupSideOffset={12}
            popupArrowStyle={{ left: 32 }}
            popupClassName={styles.methodPopup}
            placeholder="METHOD"
            dropdownStyle={{ width: "max-content", minWidth: 0 }}
            showSearch={false}
            onChange={(value) => handleChange("method", value)}
            optionContentClassName={styles.selectItemOptionContent}
            listClassName={styles.selectItemList}
            optionClassName={styles.selectItem}
            valueClassName={styles.selectSelectionItem}
            searchClassName={styles.selectSelectionSearch}
            triggerClassName={styles.selectTrigger}
            arrowClassName={styles.selectArrow}
          >
            {Array.from(
              new Set(METHODS_MAP[type].concat(customMethodList)),
            ).map((item: string) => (
              <Select.Option
                key={item}
                value={item}
                optionContentClassName={styles.selectItemOptionContent}
                listClassName={styles.selectItemList}
                optionClassName={styles.selectItem}
                valueClassName={styles.selectSelectionItem}
                searchClassName={styles.selectSelectionSearch}
                triggerClassName={styles.selectTrigger}
                className={styles.select}
                arrowClassName={styles.selectArrow}
              >
                {item}
              </Select.Option>
            ))}
          </Select>
          <div className={styles.line}></div>
        </>
      )}

      <div className={styles.urlGroupContainer}>
        {includes(["sse", "api", "websocket", "socketio", "graphql"], type) &&
          !hideServer &&
          isArray(currentEnv?.server_list) && (
            <Tooltip
              overlayInnerStyle={{ wordBreak: "break-all" }}
              title={
                <>
                  {t("supplement.from_env")}“{currentEnv?.name}“{envUrl}
                  &nbsp;
                  <span
                    style={{
                      color: themeToken.colorPrimary,
                      cursor: "pointer",
                    }}
                    onClick={() => openEnvPage({ env_id: currentEnv?.env_id })}
                  >
                    {t("supplement.go_edit")}
                  </span>
                </>
              }
            >
              <>
                {isArray(currentEnv?.server_list) &&
                  currentEnv?.server_list.some(
                    (i) => isString(i?.uri) && i?.uri.length > 0,
                  ) && (
                    <Select
                      bordered={false}
                      value={curServerId || defaultServerId}
                      labelRender={labelRender}
                      optionRender={optionRender}
                      options={serverOptions}
                      suffixIcon={
                        <AppIcon
                          style={{
                            pointerEvents: "none",
                            color: themeToken.fontLightColor,
                          }}
                          icon="chevron-down"
                        />
                      }
                      popupMatchSelectWidth={450}
                      className={classNames(
                        [
                          styles.rightSelect,
                          styles.rightSelectHttp,
                          styles.envDesc,
                        ].join(" "),
                        styles.select,
                      )}
                      onChange={(i) => {
                        updateCurrentServerId(i);
                        SetCurServerId(i);
                      }}
                      size="small"
                      dropdownRender={(menu) => (
                        <>
                          {menu}
                          <Divider style={{ margin: "4px 0" }} />
                          <Space style={{ padding: "0 8px 4px" }}>
                            <Button
                              style={{
                                color: "var(--color-primary)",
                                padding: "5px 2px",
                              }}
                              type="text"
                              icon={<AppIcon icon="plus" />}
                              onClick={addServer}
                              className={styles.button}
                            >
                              Add Server
                            </Button>
                          </Space>
                        </>
                      )}
                      optionContentClassName={styles.selectItemOptionContent}
                      listClassName={styles.selectItemList}
                      optionClassName={styles.selectItem}
                      valueClassName={styles.selectSelectionItem}
                      searchClassName={styles.selectSelectionSearch}
                      triggerClassName={styles.selectTrigger}
                      arrowClassName={styles.selectArrow}
                    />
                  )}
              </>
            </Tooltip>
          )}
        {includes(["api", "sse", "grpc", "websocket", "socketio"], type) ? (
          <VarInput
            placeholder={placeholder || t("common.enter_url_placeholder")}
            maxLength={maxLength}
            envId={envId}
            value={data?.url || ""}
            onKeyDown={onKeyDown}
            onChange={(v) => {
              handleChange("url", v);
            }}
            readOnly={readOnly}
            pasteCurlChange={pasteCurlChange}
          />
        ) : (
          <Input
            maxLength={maxLength}
            className={styles.urlGroupInput}
            placeholder={placeholder || t("common.enter_url_placeholder")}
            readOnly={readOnly}
            onChange={(e) => handleChange("url", e?.target?.value || "")}
            value={data?.url || ""}
          />
        )}
      </div>

      {includes(["api"], type) && !hideProtocol && (
        <Select
          bordered={false}
          value={data?.protocol || "http/1.1"}
          suffixIcon={
            <AppIcon
              style={{
                pointerEvents: "none",
                color: themeToken.fontLightColor,
              }}
              icon="chevron-down"
            />
          }
          popupMatchSelectWidth={false}
          className={classNames(
            [styles.rightSelect, styles.rightSelectHttp].join(" "),
            styles.select,
          )}
          onChange={handleChange.bind(null, "protocol")}
          size="small"
          optionContentClassName={styles.selectItemOptionContent}
          listClassName={styles.selectItemList}
          optionClassName={styles.selectItem}
          valueClassName={styles.selectSelectionItem}
          searchClassName={styles.selectSelectionSearch}
          triggerClassName={styles.selectTrigger}
          arrowClassName={styles.selectArrow}
        >
          {PROTOCOL_OPTIONS.map((item: { value: string; label: string }) => (
            <Select.Option
              key={item.value}
              value={item.value}
              optionContentClassName={styles.selectItemOptionContent}
              listClassName={styles.selectItemList}
              optionClassName={styles.selectItem}
              valueClassName={styles.selectSelectionItem}
              searchClassName={styles.selectSelectionSearch}
              triggerClassName={styles.selectTrigger}
              className={styles.select}
              arrowClassName={styles.selectArrow}
            >
              {item.label}
              {item.value === "http/2" && (
                <Tooltip title={t("api.response_labels.http2_tip")}>
                  <AppIcon style={{ marginLeft: 4 }} icon="circle-help" />
                </Tooltip>
              )}
            </Select.Option>
          ))}
        </Select>
      )}
      {urlGroupExtraContent}
    </div>
  );
};

export default UrlGroup;
