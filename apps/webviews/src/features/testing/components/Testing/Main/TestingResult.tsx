import type { TestingSendingData } from "@onapi/contracts";
import type { Settings } from "@onapi/domain/testing/types/common";
import { useTranslation } from "react-i18next";
import { Flex, Progress, Typography, Alert } from "@/shared/ui/base";
import { formatTimeToDateTimeLong } from "@onapi/domain/utils/time";
import { nativeStatistics } from "@/features/testing/utils/native-results";
import styles from "./TestingResult.module.css";

export default function TestingResult({
  testingSendingData: run,
  testingConfig,
  eventAllCount,
}: {
  testingSendingData: TestingSendingData;
  testingConfig: Settings;
  eventAllCount: number;
}) {
  const { t } = useTranslation();
  const stats = nativeStatistics(run.events);
  const total = testingConfig.execute_count * eventAllCount;
  const error = [...run.events]
    .reverse()
    .find((event) => event.type === "done")?.error;
  const values = [
    ["report_details.request_success_rate", stats.requestRate],
    ["report_details.assertion_success_rate", stats.assertionRate],
    ["report_details.total_requests", stats.requests],
    ["report_details.failed_requests", stats.failedRequests],
    ["report_details.failed_assertion", stats.failedAssertions],
    [
      "report_details.average_resp",
      `${stats.averageResponseTime.toFixed(2)}ms`,
    ],
    [
      "report_details.total_duration",
      `${(run.finishedAt || Date.now()) - (run.startedAt || Date.now())}ms`,
    ],
    [
      "report_details.start_at",
      run.startedAt ? formatTimeToDateTimeLong(run.startedAt) : "",
    ],
    [
      "report_details.end_at",
      run.finishedAt ? formatTimeToDateTimeLong(run.finishedAt) : "",
    ],
  ] as const;
  return (
    <Flex vertical gap={8}>
      <Typography.Text>
        {t(
          run.sendStatus === "sending"
            ? "common.in_progress"
            : run.sendStatus === "sendOver"
              ? "common.finished_success"
              : "common.not_started",
        )}
      </Typography.Text>
      {error && <Alert type="error" message={error.message} />}
      {run.sendStatus !== "sendOver" && (
        <Progress
          percent={total ? Math.min(100, (stats.requests / total) * 100) : 0}
        />
      )}
      {run.sendStatus === "sendOver" && (
        <div className={styles.container}>
          <Flex vertical gap={6}>
            {values.map(([label, value]) => (
              <Flex key={label} gap={12}>
                <Typography.Text style={{ width: 190 }}>
                  {t(label)}
                </Typography.Text>
                <Typography.Text>{value}</Typography.Text>
              </Flex>
            ))}
          </Flex>
        </div>
      )}
    </Flex>
  );
}
