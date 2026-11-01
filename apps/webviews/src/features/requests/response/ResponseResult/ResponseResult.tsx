import { sdkResponseView } from "@/features/requests/response/execution-view";
import clsx from "clsx";
import { responseText, responseLanguage } from "@onapi/domain";
import {
  forwardRef,
  memo,
  useEffect,
  useImperativeHandle,
  useMemo,
} from "react";
import { useTranslation } from "react-i18next";

import {
  Flex,
  Popover,
  SegmentedProps,
  Select,
  message,
} from "@/shared/ui/base";

import { useSafeState } from "ahooks";
import { find, forEach, isArray, map } from "lodash-es";

import SegmentedTabs from "@/shared/components/SegmentedTabs";
import AppIcon from "@/shared/ui/AppIcon";
import { BaseResponse } from "@onapi/domain/requests/types/response";
import type { SerializedResponse } from "@onapi/contracts";
import type { ResponseContent } from "./content";
import { copyStringToClipboard } from "@/shared/utils/clipboard";
import { parseStreamToRaw } from "@onapi/domain/utils/parse";

import {
  RAW_ENCODE,
  RESPONSE_RESULT_TABS_LIST,
  RESPONSE_TYPE,
} from "./constants";

import styles from "./ResponseResult.module.css";

interface Props {
  rawHtml?: string;
  mode?: string;
  data?: SerializedResponse;
  content?: ResponseContent;
  defaultRawEncode?: string;
  html?: string | null;
  resultIncludesTabs?: string[];
  onChange?: (value: BaseResponse) => void;
  responseData?: BaseResponse;
  saveExampleVisible?: boolean;
  warpVisible?: boolean;
  saveSocketMessageDom?: any;
  setMode?: (value: string) => void;
}

const ResponseResult = forwardRef((props: Props, ref) => {
  const { t } = useTranslation();
  const {
    resultIncludesTabs = ["beautify", "native", "preview", "visualization"],
    defaultRawEncode,
    data: sourceData,
    content,
    rawHtml,
    warpVisible = true,
    saveSocketMessageDom = null,
    setMode,
  } = props || {};

  const nativeResponse = useMemo(
    () => sdkResponseView(sourceData),
    [sourceData],
  );
  const contentMime = useMemo(
    () => ({ ext: content?.format, mime: content?.mime ?? "" }),
    [content?.format, content?.mime],
  );
  const [rawEncode, setRawEncode] = useSafeState(defaultRawEncode || "utf8");
  const [rawType, setRawType] = useSafeState<string>("");
  const [tabsValue, setTabsValue] = useSafeState<string | number>();
  const [warp, setWarp] = useSafeState(true);

  useEffect(() => {
    setRawType(
      nativeResponse?.header
        ? responseLanguage(nativeResponse)
        : content?.format || "json",
    );
  }, [nativeResponse?.header, content?.format]);

  useImperativeHandle(ref, () => {
    return {
      setTabsValue,
    };
  });

  const result = useMemo(() => {
    const resultList: any = [];
    forEach(resultIncludesTabs, (key: string) => {
      const item = find(
        RESPONSE_RESULT_TABS_LIST,
        (item) => item.value === key,
      );
      if (item) {
        resultList.push(item);
      }
    });

    const key = resultList[0]?.value;

    setTabsValue(key);

    return resultList;
  }, []);

  const parsedRawHtml = useMemo(() => {
    if (nativeResponse?.header) {
      return responseText(
        nativeResponse,
        rawEncode === "utf8" ? "utf-8" : rawEncode,
      );
    }
    if (content?.bytes) {
      if (rawType === "auto") {
        return parseStreamToRaw(content?.bytes, contentMime, rawEncode);
      } else {
        const mime_type = RESPONSE_TYPE?.find((e) => e.ext === rawType);
        return parseStreamToRaw(
          content?.bytes,
          mime_type || contentMime,
          rawEncode,
        );
      }
    }

    return "";
  }, [nativeResponse?.header, content?.bytes, contentMime, rawEncode, rawType]);

  const beautifyProps = {
    mode: rawType,
    editorOptions: warp ? {} : { wordWrap: "off" },
  };

  const segmentedOptions =
    (isArray(result) &&
      map(result, (item) => ({
        label: item.label,
        key: item.value,
        value: item.value,
        children: (
          <item.children
            {...props}
            content={content}
            key={item.value}
            rawEncode={rawEncode}
            rawHtml={parsedRawHtml || rawHtml}
            {...beautifyProps}
          />
        ),
      }))) ||
    [];

  const encodingLabel =
    Object.keys(RAW_ENCODE).find(
      (label) => RAW_ENCODE[label] === (rawEncode || "utf8"),
    ) || rawEncode;

  const handleOptionsChange: SegmentedProps["onChange"] = (value) => {
    setTabsValue(value);
  };

  const handleCopy = () => {
    const content = parsedRawHtml || rawHtml;
    if (!content) {
      message.error(t("supplement.clipboard_error"));
      return;
    }

    copyStringToClipboard(content, () =>
      message.success(t("supplement.clipboard_success")),
    );
  };

  useEffect(() => {
    setMode?.(rawType);
  }, [rawType]);
  return (
    <div className={styles.container}>
      <SegmentedTabs
        options={segmentedOptions}
        value={tabsValue}
        onChange={handleOptionsChange}
        wrapClassName={styles.responseResultTabsWrap}
        tabBarStartContent={
          <Select
            aria-label="Response format"
            variant="borderless"
            suffixIcon={<AppIcon icon="chevron-down" />}
            options={RESPONSE_TYPE.map(({ label, ext }) => ({
              label,
              value: ext,
            }))}
            value={rawType || "json"}
            onChange={(newVal: string) => {
              if (newVal === "auto") {
                setRawType(
                  nativeResponse?.header
                    ? responseLanguage(nativeResponse)
                    : content?.format || "json",
                );
              } else {
                setRawType(newVal);
              }
            }}
            className={styles.select}
            triggerClassName={styles.selectTrigger}
          />
        }
        tabBarExtraContent={
          <Flex
            className={clsx(styles.tabBarExtraContentWrap, styles.flex)}
            gap={4}
          >
            <Popover
              trigger="click"
              placement="bottomRight"
              title={t("request_panel.encoding")}
              content={
                <Select
                  aria-label={t("request_panel.encoding")}
                  options={Object.keys(RAW_ENCODE).map((key: string) => ({
                    label: key,
                    value: RAW_ENCODE[key],
                  }))}
                  value={rawEncode || "utf8"}
                  onChange={(newVal: string) => setRawEncode(newVal)}
                />
              }
            >
              <button
                type="button"
                className={styles.encodingButton}
                aria-label={t("request_panel.encoding")}
                title={t("request_panel.encoding")}
              >
                {encodingLabel}
                <AppIcon icon="chevron-down" />
              </button>
            </Popover>
            <button
              type="button"
              className={styles.toolButton}
              aria-label="Copy response"
              title={t("common.copy")}
              onClick={handleCopy}
            >
              <AppIcon icon="copy" />
            </button>
            {warpVisible && (
              <button
                type="button"
                className={styles.toolButton}
                aria-label="Toggle word wrap"
                aria-pressed={warp}
                title="Toggle word wrap"
                onClick={() => setWarp(!warp)}
              >
                <AppIcon icon="wrap-text" />
              </button>
            )}
            {saveSocketMessageDom}
          </Flex>
        }
        className={styles.segmented}
        headerClassName={styles.segmentedTabsHeader}
        contentClassName={styles.segmentedTabsContent}
        extraClassName={styles.tabBarExtraContentWrap}
      />
    </div>
  );
});

const PureResponseResult = memo(ResponseResult);

export default PureResponseResult;
