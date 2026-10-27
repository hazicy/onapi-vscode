import { sdkResponseView } from "@/features/requests/utils/executionView";
import classNames from "classnames";
import { responseText, responseLanguage } from "@onapi/domain";
import {
  forwardRef,
  memo,
  useEffect,
  useImperativeHandle,
  useMemo,
} from "react";
import { useTranslation } from "react-i18next";

import { Flex, SegmentedProps, Select, message } from "@/shared/ui/base";

import { useSafeState } from "ahooks";
import { find, forEach, isArray, isPlainObject, map } from "lodash-es";

import SegmentedTabs from "@/shared/components/SegmentedTabs";
import AppIcon from "@/shared/ui/AppIcon";
import { BaseResponse } from "@onapi/domain/requests/types/response";
import { ApiSendingData } from "@onapi/domain/requests/types/send";
import { copyStringToClipboard } from "@/shared/utils/common";
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
  data?:
    | ApiSendingData["response"]
    | import("@onapi/contracts").SerializedResponse;
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
    rawHtml,
    warpVisible = true,
    saveSocketMessageDom = null,
    setMode,
  } = props || {};

  const nativeResponse = useMemo(
    () => sdkResponseView(sourceData),
    [sourceData],
  );
  const data =
    sourceData && !("header" in sourceData)
      ? (sourceData as ApiSendingData["response"])
      : undefined;
  const [rawEncode, setRawEncode] = useSafeState(defaultRawEncode || "utf8");
  const [rawType, setRawType] = useSafeState<string>("");
  const [tabsValue, setTabsValue] = useSafeState<string | number>();
  const [warp, setWarp] = useSafeState(true);

  useEffect(() => {
    setRawType(
      nativeResponse?.header
        ? responseLanguage(nativeResponse)
        : data?.mime_type?.ext || "json",
    );
  }, [nativeResponse?.header, data?.mime_type?.ext]);

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
    if (data?.stream?.data && isPlainObject(data?.mime_type)) {
      if (rawType === "auto") {
        return parseStreamToRaw(data?.stream?.data, data?.mime_type, rawEncode);
      } else {
        const mime_type = RESPONSE_TYPE?.find((e) => e.ext === rawType);
        return parseStreamToRaw(
          data?.stream?.data,
          mime_type || data?.mime_type,
          rawEncode,
        );
      }
    }

    return "";
  }, [
    data?.body,
    nativeResponse?.header,
    data?.stream?.data,
    data?.mime_type,
    rawEncode,
    rawType,
  ]);

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
            key={item.value}
            rawEncode={rawEncode}
            rawHtml={parsedRawHtml || rawHtml}
            {...beautifyProps}
          />
        ),
      }))) ||
    [];

  const handleOptionsChange: SegmentedProps["onChange"] = (value) => {
    setTabsValue(value);
  };

  const handleCopy = () => {
    if (!rawHtml) {
      message.error(t("supplement.clipboard_error"));
      return;
    }

    copyStringToClipboard(rawHtml, () =>
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
        tabBarExtraContent={
          <Flex
            className={classNames(styles.tabBarExtraContentWrap, styles.flex)}
            gap={8}
          >
            <Select
              // style={{ width: 110 }}
              options={RESPONSE_TYPE.map(({ label, ext }) => ({
                label,
                value: ext,
              }))}
              popupMatchSelectWidth={false}
              value={rawType || "json"}
              onChange={(newVal: string) => {
                if (newVal === "auto") {
                  setRawType(
                    nativeResponse?.header
                      ? responseLanguage(nativeResponse)
                      : data?.mime_type?.ext || "json",
                  );
                } else {
                  setRawType(newVal);
                }
              }}
              className={styles.select}
              triggerClassName={styles.selectTrigger}
            />
            <Select
              // style={{ width: 110 }}
              options={Object.keys(RAW_ENCODE).map((key: string) => ({
                label: key,
                value: RAW_ENCODE[key],
              }))}
              popupMatchSelectWidth={false}
              value={rawEncode || "utf8"}
              onChange={(newVal: string) => setRawEncode(newVal)}
              className={styles.select}
              triggerClassName={styles.selectTrigger}
            />
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
