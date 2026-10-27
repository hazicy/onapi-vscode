import styles from "./TestingResult.module.css";
import { useMemo } from "react";

import useTheme from "@/shared/hooks/useTheme";
import { Flex, Progress, Typography } from "@/shared/ui/base";
import {
  chunk,
  floor,
  forEach,
  isEmpty,
  isNumber,
  round,
  toUpper,
} from "lodash-es";
import { formatTimeToDateTimeLong } from "@onapi/domain/utils/time";
import { getPercent } from "../utils";
import { TestingSendingData } from "@onapi/domain/testing/types/index";
import { Settings } from "@onapi/domain/testing/types/common";
import { isAssertPass } from "@/shared/utils/common";
import { t } from "i18next";

type TestingResultProps = {
  eventAllCount: number;
  testingSendingData: Partial<TestingSendingData>;
  testingConfig: Settings;
};

const TestingResult = ({
  eventAllCount,
  testingSendingData,
  testingConfig,
}: TestingResultProps) => {
  const { themeToken } = useTheme();

  const renderStatusText = useMemo(() => {
    if (testingSendingData.sendStatus === "initial") {
      return t("common.not_started");
    }
    if (testingSendingData.sendStatus === "sending") {
      return t("common.in_progress");
    }
    if (testingSendingData.sendStatus === "sendOver") {
      // Calculate successful and failed iterations
      const towDArr = chunk(testingSendingData.requestList, eventAllCount);
      let successNum = 0;
      let failuresNum = 0;
      forEach(towDArr, (arr) => {
        successNum = successNum + 1;
        forEach(arr, (item) => {
          if (
            toUpper(item?.data?.status?.http) !== "OK" ||
            !isAssertPass(item?.data?.status?.assert)
          ) {
            failuresNum = failuresNum + 1;
            successNum = successNum - 1;
            return false;
          }
        });
      });
      return `${t("common.finished_success")}: ${successNum}, ${t("common.failures")}: ${failuresNum}`;
    }
    return t("common.not_started");
  }, [
    testingSendingData.sendStatus,
    testingSendingData.requestList,
    eventAllCount,
  ]);

  const renderIterationText = useMemo(() => {
    const resultCount = testingSendingData.requestList?.length || 0;

    const iterationTime =
      eventAllCount === 0 ? 0 : floor(resultCount / eventAllCount);

    return `${iterationTime}/${testingConfig.execute_count}`;
  }, [
    testingConfig.execute_count,
    eventAllCount,
    testingSendingData.requestList,
  ]);

  const percent = useMemo(() => {
    const allCount = testingConfig.execute_count * eventAllCount;
    const resultCount = testingSendingData.requestList?.length || 0;
    return round(resultCount / allCount, 2) * 100;
  }, [
    testingConfig.execute_count,
    eventAllCount,
    testingSendingData.requestList,
  ]);

  const results = {
    left: [
      {
        key: "request_success_rate",
        value: t("report_details.request_success_rate"),
      },
      {
        key: "assertion_success_rate",
        value: t("report_details.assertion_success_rate"),
      },
      { key: "total_duration", value: t("report_details.total_duration") },
      { key: "start_at", value: t("report_details.start_at") },
      { key: "total_requests", value: t("report_details.total_requests") },
    ],
    right: [
      { key: "failed_requests", value: t("report_details.failed_requests") },
      { key: "failed_assertions", value: t("report_details.failed_assertion") },
      { key: "average_resp_time", value: t("report_details.average_resp") },
      { key: "end_at", value: t("report_details.end_at") },
    ],
  };
  const getNameValue = (name: string) => {
    const {
      http,
      assert,
      total_request_count,
      total_time,
      start_at,
      avg_response_time,
      end_at,
    } = testingSendingData.complete;

    // Handle units
    const totalTime = isNumber(total_time)
      ? total_time < 1000
        ? `${total_time}ms`
        : `${total_time % 1000 === 0 ? total_time / 1000 : (total_time / 1000).toFixed(2)}s`
      : `${total_time}ms`;

    switch (name) {
      case "request_success_rate":
        return getPercent(http.success, http);
      case "assertion_success_rate":
        return getPercent(assert.success, assert);
      case "total_requests":
        return total_request_count || http.total;
      case "total_duration":
        return `${totalTime}`;
      case "start_at":
        return formatTimeToDateTimeLong(start_at);
      case "Assertions Runs":
        return assert.total;
      case "failed_assertions":
        return assert.error;
      case "failed_requests":
        return http.error;
      case "average_resp_time":
        return `${avg_response_time}ms`;
      case "end_at":
        return formatTimeToDateTimeLong(end_at);
      default:
        break;
    }

    return "";
  };

  return (
    <Flex vertical>
      <Flex vertical gap={8}>
        <Typography.Text>
          <Flex gap={4} align="center">
            {t("common.processing_iteration")} {renderIterationText}
            <Typography.Text
              style={{ fontSize: "12px", color: "var(--font-light-color)" }}
            >
              ({renderStatusText})
            </Typography.Text>
          </Flex>
        </Typography.Text>
        {isEmpty(testingSendingData?.complete) && (
          <Progress percent={percent} />
        )}
      </Flex>
      {!isEmpty(testingSendingData?.complete) && (
        <div className={styles.container}>
          <Flex flex={1} gap={6} vertical>
            {results.left.map(({ key, value }) => (
              <Flex key={key} gap={12}>
                <Typography.Text
                  style={{ width: "190px", color: "var(--font-light-color)" }}
                >
                  {value}
                </Typography.Text>
                <Typography.Text style={{ color: "var(--font-content-color)" }}>
                  {getNameValue(key)}
                </Typography.Text>
              </Flex>
            ))}
          </Flex>
          <Flex flex={1} gap={6} vertical>
            {results.right.map(({ key, value }) => (
              <Flex gap={12}>
                <Typography.Text
                  style={{ width: "190px", color: "var(--font-light-color)" }}
                >
                  {value}
                </Typography.Text>
                <Typography.Text style={{ color: "var(--font-content-color)" }}>
                  {getNameValue(key)}
                </Typography.Text>
              </Flex>
            ))}
          </Flex>
        </div>
      )}
    </Flex>
  );
};

export default TestingResult;
