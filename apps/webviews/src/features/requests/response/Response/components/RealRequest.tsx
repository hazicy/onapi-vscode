import type { HttpExecutionState } from "@/features/requests/execution/http-state";
import { sdkRequestView } from "@/features/requests/utils/executionView";
import { requestUrl } from "@onapi/domain";
import styles from "./RealRequest.module.css";
import React from "react";
import { useTranslation } from "react-i18next";

import { Flex, SegmentedProps, Typography } from "@/shared/ui/base";

import { useMemoizedFn, useSafeState } from "ahooks";
import { isEqual } from "lodash-es";

import CodeEditor from "@/shared/components/CodeEditor/CodeEditor";
import SegmentedTabs from "@/shared/components/SegmentedTabs";
import ApisTypeTag from "@/shared/ui/ApisTypeTag";
import { APIS_TARGET_TYPE_ENUM } from "@onapi/domain/requests/constants/index";
import { ApiTypeMethod } from "@onapi/domain/requests/types/base";

import CommonTable from "./CommonTable";

const { Text } = Typography;

interface Props {
  sendingData?: HttpExecutionState;
}

const RealRequest: React.FC<Props> = ({ sendingData }) => {
  const { t } = useTranslation();
  const requestView = sdkRequestView(sendingData?.result?.request);
  const [tabsValue, setTabsValue] = useSafeState<string | number>("header");

  const handleOptionsChange: SegmentedProps["onChange"] = useMemoizedFn(
    (value) => {
      setTabsValue(value);
    },
  );

  const segmentedOptions = [
    {
      value: "header",
      label: "header",
      children: <CommonTable value={requestView?.header || []} />,
    },
    {
      value: "query",
      label: "params",
      children: <CommonTable value={requestView?.query || []} />,
    },
    {
      value: "path",
      label: "path",
      children: <CommonTable value={requestView?.variable || []} />,
    },
    {
      value: "body",
      label: "body",
      children: <BodyParameter request={sendingData?.result?.request} />,
    },
  ];

  const tabBarExtraContent = isEqual(tabsValue, "body") ? (
    <Flex align={"center"} className={styles.tabBarExtraContent}>
      <div className={styles.title}>{t("supplement.type")}:</div>
      <div className={styles.content}>
        {sendingData?.result?.request?.body?.mode}
      </div>
    </Flex>
  ) : null;

  return (
    <div className={styles.container}>
      <Flex vertical={true} gap={8} className={styles.requestItem}>
        <Text className={styles.title}>{t("supplement.req_url")}</Text>
        <div className={[styles.contentWarp, styles.baseInfoWrap].join(" ")}>
          <Flex align="flex-start">
            <ApisTypeTag
              targetType={APIS_TARGET_TYPE_ENUM.API}
              method={
                (sendingData?.result?.request?.method as ApiTypeMethod) || "GET"
              }
            />
            <div className={styles.url}>
              {requestUrl({ request: sendingData?.result?.request })}
            </div>
          </Flex>
        </div>
      </Flex>
      <Flex vertical={true} gap={8} className={styles.requestItem}>
        <Text className={styles.title}>{t("supplement.req_param")}</Text>
        <div className={[styles.contentWarp, styles.contentRequest].join(" ")}>
          <SegmentedTabs
            options={segmentedOptions}
            tabBarExtraContent={tabBarExtraContent}
            value={tabsValue}
            onChange={handleOptionsChange}
            headerClassName={styles.segmentedTabsHeader}
          />
        </div>
      </Flex>
    </div>
  );
};

const BodyParameter = ({
  request,
}: {
  request?: import("postman-collection").RequestDefinition;
}) => {
  const { t } = useTranslation();
  const requestView = sdkRequestView(request);
  return requestView?.body !== undefined ? (
    <CodeEditor value={requestView.body} language="json" readOnly />
  ) : (
    <Text>{t("supplement.no_req_param")}</Text>
  );
};

export default RealRequest;
