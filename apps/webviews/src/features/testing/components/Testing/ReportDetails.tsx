import styles from "./ReportDetails.module.css";

import type { TestingReportList } from "@onapi/contracts";
import TestingMain from "@/features/testing/components/Testing/Main/Main";

type ReportDetailsProps = {
  reportDetails: TestingReportList;
};

const ReportDetails = ({ reportDetails }: ReportDetailsProps) => {
  return (
    <div className={styles.container}>
      <TestingMain
        is_report={true}
        testingSendingData={{
          sendStatus: "sendOver",
          events: reportDetails.events,
          startedAt: reportDetails.startedAt,
          finishedAt: reportDetails.finishedAt,
          environmentName: reportDetails.environmentName,
        }}
        testingConfig={reportDetails.testingConfig}
        eventList={[]}
        eventAllCount={reportDetails?.eventAllCount}
      />
    </div>
  );
};

export default ReportDetails;
