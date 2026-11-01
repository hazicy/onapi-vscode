import type { SerializedResponse } from "@onapi/contracts";
import { responseDownload } from "./response-download";

import styles from "./ResponseSize.module.css";
import React, { memo, useMemo } from "react";
import { useTranslation } from "react-i18next";

import { Col, Flex, Row } from "@/shared/ui/base";

import clsx from "clsx";
import { get } from "lodash-es";

import { Tooltip } from "@/shared/ui";
import AppIcon from "@/shared/ui/AppIcon";
import CustomPopover from "@/shared/ui/Popover";
import { RESPONSE_CODE_DESC_MAP } from "@onapi/domain/requests/constants/response";
import useTheme from "@/shared/hooks/useTheme";
import useSystemConfig from "@/features/settings/store/useSystemConfig";
import {
  convertResponseBytes,
  convertResponseTime,
  download,
  hexToRGBA,
} from "@/shared/utils/common";

interface ResponseSizeProps {
  response?: SerializedResponse;
  showProxy?: boolean;
  showIcon?: boolean;
  showDownload?: boolean;
  showLine?: boolean;
}

const ResponseSize: React.FC<ResponseSizeProps> = (props) => {
  const {
    response: sourceResponse,
    showDownload = false,
    showIcon = true,
    showProxy = true,
    showLine = true,
  } = props;
  const { t } = useTranslation();
  const { themeToken } = useTheme();

  const systemConfig = useSystemConfig((state) => state.systemConfig);
  const { proxy: systemProxy } = systemConfig || {};

  const responseCode = sourceResponse?.code;
  const responseSize =
    sourceResponse?.responseSize ?? sourceResponse?.stream?.data.length ?? 0;
  const responseTime = sourceResponse?.responseTime;
  const originResponseSizeFormat = convertResponseBytes(responseSize);

  const handleDownload = () => {
    const prepared = responseDownload(sourceResponse, t("supplement.res_data"));
    if (prepared) {
      download(prepared.data, prepared.name, prepared.mime);
    }
  };

  const proxyContent = (
    <div style={{ width: 180 }}>
      <Row gutter={[0, 8]}>
        <Col span={24}>
          <Flex
            justify="space-between"
            className={clsx(styles.responseSizeTitle)}
          >
            <span>{t("common.response_indicators.network")}</span>
          </Flex>
        </Col>
        <Col span={24}>
          <Flex flex={1} justify="space-between">
            <span>{t("common.response_indicators.local")}</span>
            <span>{t("common.response_indicators.no_local")}</span>
          </Flex>
        </Col>
      </Row>
    </div>
  );

  const responseCodeDesc = useMemo(() => {
    if (responseCode) {
      return get(RESPONSE_CODE_DESC_MAP, responseCode);
    }
    return { name: "", desc: "" };
  }, [responseCode]);

  const responseCodeContent = (
    <Flex
      gap={8}
      style={{ width: 240 }}
      className={clsx(styles.customCodePopover)}
    >
      <Flex
        className={clsx(styles.iconCode, {
          [styles.success]: String(responseCode).charAt(0) === "2",
        })}
      >
        <AppIcon
          icon={
            String(responseCode).charAt(0) === "2" ? "circle-check" : "circle-x"
          }
          className={styles.icon}
        />
      </Flex>
      <Flex gap={4} vertical>
        <Flex className={clsx(styles.name)} gap={4}>
          <span>{responseCode}</span>
          <span>{responseCodeDesc?.name}</span>
        </Flex>
        <Flex className={clsx(styles.desc)} wrap="wrap">
          {responseCodeDesc?.desc}
        </Flex>
      </Flex>
    </Flex>
  );

  const responseTimeStr = useMemo(() => {
    return convertResponseTime(responseTime);
  }, [responseTime]);

  return (
    <Flex gap={8} align="center" className={clsx(styles.responseSize)}>
      {responseCode !== 0 && (
        <>
          {responseCode && (
            <Flex>
              <CustomPopover nativeButton={false} content={responseCodeContent}>
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

          <Flex gap={6} align="center">
            {responseTime !== undefined && (
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
                <span>{responseTimeStr}</span>
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
              <Flex>
                <Tooltip title={t("common.response_indicators.size")}>
                  <span>{`${originResponseSizeFormat.convertedValue}${originResponseSizeFormat.unit}`}</span>
                </Tooltip>
              </Flex>
            </>
          )}
        </>
      )}

      {showProxy && (
        <>
          <CustomPopover nativeButton={false} content={proxyContent}>
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
      {showLine && showProxy && showDownload && (
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
