import ResponseNetwork from "./ResponseNetwork";
import { timingSegments } from "../utils/response-metrics";
import { responseDownload } from "../utils/response-download";
import { sdkResponseView } from "@/features/requests/utils/executionView";
import { responseText } from "@onapi/domain";
import styles from "./ResponseSize.module.css";
import React, { memo, useMemo } from "react";
import { useTranslation } from "react-i18next";

import { Col, Divider, Flex, Row } from "@/shared/ui/base";

import { bufferToRaw } from "@onapi/domain/utils/response-tools";
import clsx from "clsx";
import {
  add,
  divide,
  get,
  has,
  isEmpty,
  isEqual,
  isNil,
  isPlainObject,
  isString,
  isUndefined,
  map,
  multiply,
  omit,
  some,
  subtract,
  sumBy,
  values,
} from "lodash-es";

import { Tooltip } from "@/shared/ui";
import AppIcon from "@/shared/ui/AppIcon";
import CustomPopover from "@/shared/ui/Popover";
import {
  HTTPS_TIME_ARRAY,
  HTTP_TIME_ARRAY,
  RESPONSE_CODE_DESC_MAP,
} from "@onapi/domain/requests/constants/response";
import useTheme from "@/shared/hooks/useTheme";
import useSystemConfig from "@/features/settings/store/useSystemConfig";
import {
  ApiSendResponseDataProxy,
  ApiSendingData,
} from "@onapi/domain/requests/types/send";
import {
  convertResponseBytes,
  convertResponseTime,
  download,
  hexToRGBA,
  toFixed,
} from "@/shared/utils/common";

interface ResponseSizeProps {
  response?:
    | ApiSendingData["response"]
    | import("@onapi/contracts").SerializedResponse;
  request?:
    | ApiSendingData["request"]
    | import("postman-collection").RequestDefinition;
  showProxy?: boolean;
  showIcon?: boolean;
  showDownload?: boolean;
  showLine?: boolean;
}

const ResponseSize: React.FC<ResponseSizeProps> = (props) => {
  const {
    response: sourceResponse,
    request: sourceRequest,
    showDownload = false,
    showIcon = true,
    showProxy = true,
    showLine = true,
  } = props || {};
  const { t } = useTranslation();
  const { themeToken } = useTheme();

  const systemConfig = useSystemConfig((state) => state.systemConfig);
  const { proxy: systemProxy } = systemConfig || {};

  const nativeResponse = sdkResponseView(sourceResponse);
  const response =
    sourceResponse && !("header" in sourceResponse)
      ? (sourceResponse as ApiSendingData["response"])
      : undefined;
  const request =
    sourceRequest && "headers" in sourceRequest
      ? (sourceRequest as ApiSendingData["request"])
      : undefined;
  const timings = response?.timings;
  const responseCode = sourceResponse?.code;
  const responseSize =
    nativeResponse?.responseSize ??
    response?.stream?.data?.byteLength ??
    response?.response_size ??
    0;
  const originResponseSizeFormat = convertResponseBytes(responseSize);
  const responseTime = nativeResponse?.responseTime ?? response?.response_time;
  const responseProxy = response?.proxy;
  const requestProxy = request?.proxy;
  const formatTimings = response?.formatTimings;
  const formatSize = response?.formatSize;
  const network = response?.network;
  const isNewTimings = !isNil(response?.formatTimings);

  const handleDownload = () => {
    const prepared = responseDownload(sourceResponse, t("supplement.res_data"));
    if (prepared) {
      download(prepared.data, prepared.name, prepared.mime);
    }
  };

  const computedProxyValue = (
    requestProxy: ApiSendResponseDataProxy | undefined,
    responseProxy: ApiSendResponseDataProxy | undefined,
  ) => {
    if (responseProxy?.href) {
      return responseProxy?.href;
    }

    if (requestProxy?.host && requestProxy?.port) {
      return `${requestProxy?.host}:${requestProxy?.port}`;
    }

    return t("common.response_indicators.no_local");
  };

  const proxyContent = (
    <div style={{ width: 180 }} className={styles.container}>
      <Row gutter={[0, 8]}>
        <Col span={24}>
          <Flex
            justify="space-between"
            className={clsx(styles.responseSizeTitle, styles.flex)}
          >
            <span>{t("common.response_indicators.network")}</span>
          </Flex>
        </Col>
        <Col span={24}>
          <Flex flex={1} justify="space-between" className={styles.flex}>
            <span>{t("common.response_indicators.local")}</span>
            <span>{computedProxyValue(requestProxy, responseProxy)}</span>
          </Flex>
        </Col>
      </Row>
    </div>
  );

  const timeContentList = useMemo(
    () => timingSegments(formatTimings),
    [formatTimings],
  );

  const responseCodeDesc = useMemo(() => {
    if (responseCode) {
      return get(RESPONSE_CODE_DESC_MAP, responseCode);
    }
    return { name: "", desc: "" };
  }, [responseCode]);

  const responseSizeFormat = useMemo(() => {
    if (!formatSize) {
      return {};
    }
    const resSize = convertResponseBytes(
      add(formatSize.responseHeaders, formatSize.responseBody),
    );
    const resHeaderSize = convertResponseBytes(formatSize.responseHeaders);
    const resBodySize = convertResponseBytes(formatSize.responseBody);
    const reqSize = convertResponseBytes(
      add(formatSize.requestHeaders, formatSize.requestBody),
    );
    const reqHeaderSize = convertResponseBytes(formatSize.requestHeaders);
    const reqBodySize = convertResponseBytes(formatSize.requestBody);
    const resUnCompressSize = convertResponseBytes(
      formatSize.uncompressedResponseBody || 0,
    );
    return {
      responseSize: `${resSize.convertedValue}${resSize.unit}`,
      responseHeaders: `${resHeaderSize.convertedValue}${resHeaderSize.unit}`,
      responseBody: `${resBodySize.convertedValue}${resBodySize.unit}`,
      requestSize: `${reqSize.convertedValue}${reqSize.unit}`,
      requestHeaders: `${reqHeaderSize.convertedValue}${reqHeaderSize.unit}`,
      requestBody: `${reqBodySize.convertedValue}${reqBodySize.unit}`,
      responseUnCompress: `${resUnCompressSize.convertedValue}${resUnCompressSize.unit}`,
    };
  }, [formatSize]);

  const responseSizeContent = (
    <Flex
      vertical
      style={{ width: 300 }}
      className={clsx(styles.customSizePopover, styles.flex)}
    >
      <Flex gap={4} vertical className={styles.flex}>
        <Flex style={{ width: "100%" }} gap={8} className={styles.flex}>
          <Flex className={clsx(styles.iconWrapper, styles.flex)}>
            <AppIcon icon="download" className={styles.icon} />
          </Flex>
          <Flex flex={1} gap={4} vertical className={styles.flex}>
            <Flex
              justify="space-between"
              className={clsx(styles.name, styles.flex)}
              gap={4}
            >
              <span>Response Size</span>
              <span>{responseSizeFormat?.responseSize}</span>
            </Flex>
            <Flex
              justify="space-between"
              className={clsx(styles.desc, styles.flex)}
              gap={4}
            >
              <span>Headers</span>
              <span>{responseSizeFormat?.responseHeaders}</span>
            </Flex>
            <Flex
              justify="space-between"
              className={clsx(styles.desc, styles.flex)}
              gap={4}
            >
              <span>Body</span>
              <span>{responseSizeFormat?.responseBody}</span>
            </Flex>
            {has(formatSize, "uncompressedResponseBody") && (
              <Flex
                justify="space-between"
                className={clsx(styles.desc, styles.flex)}
                gap={4}
              >
                <span>Uncompressed</span>
                <span>{responseSizeFormat?.responseUnCompress}</span>
              </Flex>
            )}
          </Flex>
        </Flex>
        <Divider style={{ margin: "8px 0" }} />
        <Flex style={{ width: "100%" }} gap={8} className={styles.flex}>
          <Flex
            className={clsx(
              [styles.iconWrapper, styles.request].join(" "),
              styles.flex,
            )}
          >
            <AppIcon rotate={180} icon="download" className={styles.icon} />
          </Flex>
          <Flex flex={1} gap={4} vertical className={styles.flex}>
            <Flex
              justify="space-between"
              className={clsx(styles.name, styles.flex)}
              gap={4}
            >
              <span>Request Size</span>
              <span>{responseSizeFormat?.requestSize}</span>
            </Flex>
            <Flex
              justify="space-between"
              className={clsx(styles.desc, styles.flex)}
              gap={4}
            >
              <span>Headers</span>
              <span>{responseSizeFormat?.requestHeaders}</span>
            </Flex>
            <Flex
              justify="space-between"
              className={clsx(styles.desc, styles.flex)}
              gap={4}
            >
              <span>Body</span>
              <span>{responseSizeFormat?.requestBody}</span>
            </Flex>
          </Flex>
        </Flex>
      </Flex>
    </Flex>
  );

  const responseCodeContent = (
    <Flex
      gap={8}
      style={{ width: 240 }}
      className={clsx(styles.customCodePopover, styles.flex)}
    >
      <Flex
        className={clsx(
          styles.iconCode,
          {
            [styles.success]: String(responseCode).charAt(0) === "2",
          },
          styles.flex,
        )}
      >
        <AppIcon
          icon={
            String(responseCode).charAt(0) === "2" ? "circle-check" : "circle-x"
          }
          className={styles.icon}
        />
      </Flex>
      <Flex gap={4} vertical className={styles.flex}>
        <Flex className={clsx(styles.name, styles.flex)} gap={4}>
          <span>{responseCode}</span>
          <span>{responseCodeDesc?.name}</span>
        </Flex>
        <Flex className={clsx(styles.desc, styles.flex)} wrap="wrap">
          {responseCodeDesc?.desc}
        </Flex>
      </Flex>
    </Flex>
  );

  const newTimeContent = (
    <div style={{ width: 380 }} className={styles.container}>
      <Flex align="flex-start" gap={4} className={styles.flex}>
        <AppIcon
          style={{
            marginTop: 2,
            color: "var(--font-title-color)",
            fontSize: "14px",
          }}
          icon="clock"
          className={styles.icon}
        />
        <Flex flex={1} vertical className={styles.flex}>
          <Row gutter={[8, 8]}>
            <Col span={24}>
              <Flex
                justify="space-between"
                className={clsx(styles.newResponseSizeTitle, styles.flex)}
              >
                Response Time
                <span>{`${toFixed(formatTimings?.total?.duration || 0)}ms`}</span>
              </Flex>
            </Col>
          </Row>

          {map(
            timeContentList,
            ({ key, name, lineLeftSize, lineRightSize, width, marginLeft }) => (
              <Row
                className={clsx(styles[key] ?? key, {
                  [styles.empty]: isEqual(width, 0),
                })}
                gutter={[8, 8]}
              >
                <Col style={{ lineHeight: "26px" }} span={8}>
                  {name}
                </Col>
                <Col style={{ height: 24 }} span={12}>
                  <div className={styles.progress}>
                    <div
                      style={{ left: `${lineLeftSize}%` }}
                      className={styles.progressLeft}
                    ></div>
                    <div
                      style={{
                        width: `${width}%`,
                        marginLeft: `${marginLeft}%`,
                      }}
                      className={clsx(
                        styles.progressContent,
                        styles[key] ?? key,
                      )}
                    ></div>
                    <div
                      style={{ left: `${lineRightSize}%` }}
                      className={styles.progressRight}
                    ></div>
                  </div>
                </Col>
                <Col
                  style={{ textAlign: "right", lineHeight: "26px" }}
                  span={4}
                >
                  {isEqual(width, 0)
                    ? "Cache"
                    : `${toFixed(get(formatTimings, key)?.duration)}ms`}
                </Col>
              </Row>
            ),
          )}
        </Flex>
      </Flex>
    </div>
  );

  const timeContent = (
    <div style={{ width: 240 }} className={styles.container}>
      <Row gutter={[0, 8]}>
        <Col span={24}>
          <Flex
            justify="space-between"
            className={clsx(styles.responseSizeTitle, styles.flex)}
          >
            <span>{t("common.response_indicators.event")}</span>
            <span>{t("common.response_indicators.use_time")}</span>
          </Flex>
        </Col>
        {!isNil(timings?.request) && (
          <Col span={24}>
            <Flex flex={1} justify="space-between" className={styles.flex}>
              <span>Request</span>
              <span className={styles.time}>{toFixed(timings.request)}ms</span>
            </Flex>
          </Col>
        )}

        {!isNil(timings?.socket) && (
          <Col span={24}>
            <Flex justify="space-between" className={styles.flex}>
              <span>Socket</span>
              <span className={styles.time}>{toFixed(timings.socket)}ms</span>
            </Flex>
          </Col>
        )}
        {!isNil(timings?.lookup) && (
          <Col span={24}>
            <Flex justify="space-between" className={styles.flex}>
              <span>Lookup</span>
              <span className={styles.time}>{toFixed(timings.lookup)}ms</span>
            </Flex>
          </Col>
        )}

        {!isNil(timings?.connect) && (
          <Col span={24}>
            <Flex justify="space-between" className={styles.flex}>
              <span>Connect</span>
              <span className={styles.time}>{toFixed(timings.connect)}ms</span>
            </Flex>
          </Col>
        )}

        {!isNil(timings?.secure_connect) && (
          <Col span={24}>
            <Flex justify="space-between" className={styles.flex}>
              <span>SecureConnect</span>
              <span className={styles.time}>
                {toFixed(timings.secure_connect)}ms
              </span>
            </Flex>
          </Col>
        )}

        {!isNil(timings?.response) && (
          <Col span={24}>
            <Flex justify="space-between" className={styles.flex}>
              <span>Response</span>
              <span className={styles.time}>{toFixed(timings.response)}ms</span>
            </Flex>
          </Col>
        )}

        {!isNil(timings?.end) && (
          <Col span={24}>
            <Flex justify="space-between" className={styles.flex}>
              <span>End</span>
              <span className={styles.time}>{toFixed(timings.end)}ms</span>
            </Flex>
          </Col>
        )}
        {!isNil(timings?.done) && (
          <Col span={24}>
            <Flex justify="space-between" className={styles.flex}>
              <span>Done</span>
              <span className={styles.time}>{toFixed(timings.done)}ms</span>
            </Flex>
          </Col>
        )}
      </Row>
    </div>
  );

  const responseTimeStr = useMemo(() => {
    return convertResponseTime(responseTime);
  }, [responseTime]);

  return (
    <Flex
      gap={8}
      align="center"
      className={clsx(styles.responseSize, styles.flex)}
    >
      {responseCode !== 0 && (
        <>
          {responseCode && (
            <Flex className={styles.flex}>
              <CustomPopover content={responseCodeContent}>
                <span
                  style={{
                    padding: "0px 8px",
                    borderRadius: "var(--border-radius)",
                    border: "1px solid",
                    borderColor:
                      String(responseCode).charAt(0) === "2"
                        ? hexToRGBA("#26CEA4", 0.15)
                        : hexToRGBA("#ff583e", 0.15),
                    background:
                      String(responseCode).charAt(0) === "2"
                        ? hexToRGBA("#26CEA4", 0.1)
                        : hexToRGBA("#ff583e", 0.1),
                    color:
                      String(responseCode).charAt(0) === "2"
                        ? themeToken.colorSuccess
                        : themeToken.colorError,
                  }}
                >
                  {responseCode}
                </span>
              </CustomPopover>
            </Flex>
          )}

          <Flex gap={6} align="center" className={styles.flex}>
            {responseTime && (
              <>
                <svg
                  width="4"
                  height="4"
                  viewBox="0 0 4 4"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <circle
                    cx="2"
                    cy="2"
                    r="2"
                    fill="var(--check-box-border-color)"
                  />
                </svg>
                {!isEmpty(timings) ? (
                  <CustomPopover
                    content={isNewTimings ? newTimeContent : timeContent}
                  >
                    <span className={styles.curPointer}>{responseTimeStr}</span>
                  </CustomPopover>
                ) : (
                  <span>{responseTimeStr}</span>
                )}
              </>
            )}
          </Flex>

          {responseSize > 0 && (
            <>
              <svg
                width="4"
                height="4"
                viewBox="0 0 4 4"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <circle
                  cx="2"
                  cy="2"
                  r="2"
                  fill="var(--check-box-border-color)"
                />
              </svg>
              <Flex className={styles.flex}>
                <Tooltip title={t("common.response_indicators.size")}></Tooltip>
                <CustomPopover
                  overlayInnerStyle={{
                    padding: isNewTimings ? "16px 20px" : "6px 8px",
                  }}
                  content={
                    isNewTimings
                      ? responseSizeContent
                      : t("common.response_indicators.size")
                  }
                >
                  <span>{`${originResponseSizeFormat.convertedValue}${originResponseSizeFormat.unit}`}</span>
                </CustomPopover>
              </Flex>
              <svg
                width="4"
                height="4"
                viewBox="0 0 4 4"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <circle
                  cx="2"
                  cy="2"
                  r="2"
                  fill="var(--check-box-border-color)"
                />
              </svg>
            </>
          )}
        </>
      )}

      {showProxy && (
        <>
          <CustomPopover
            content={
              isNewTimings ? (
                <ResponseNetwork network={network} />
              ) : (
                proxyContent
              )
            }
          >
            <AppIcon
              icon="network"
              className={clsx(styles.curPointer, styles.icon)}
              style={{
                color:
                  systemProxy === 2
                    ? themeToken.fontContentColor
                    : themeToken.colorSuccess,
              }}
            />
          </CustomPopover>
        </>
      )}
      {showLine && (
        <svg
          width="1"
          height="10"
          viewBox="0 0 1 10"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <line
            x1="0.5"
            y1="2.18556e-08"
            x2="0.5"
            y2="10"
            stroke="var(--check-box-border-color)"
          />
        </svg>
      )}

      {showDownload ? (
        <Tooltip title={t("response.download_tip")}>
          <AppIcon
            style={{ fontSize: 14 }}
            className={clsx(styles.curPointer, styles.icon)}
            onClick={handleDownload}
            icon="download"
          />
        </Tooltip>
      ) : (
        showIcon &&
        (String(responseCode).charAt(0) === "2" ? (
          <AppIcon
            icon="circle-check"
            style={{ color: themeToken.colorSuccess }}
            className={styles.icon}
          />
        ) : null)
      )}
    </Flex>
  );
};

export default memo(ResponseSize);
