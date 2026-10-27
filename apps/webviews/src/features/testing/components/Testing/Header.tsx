import styles from "./Testing.module.css";
import useTesting from "@/features/testing/store/useTesting";
import clsx from "clsx";
import { Button, Flex } from "@/shared/ui/base";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

type TestingHeaderProps = {
  folderName: string;
  onRunClick: () => void;
  setShowReportList: (val: boolean) => void;
};

const TestingHeader = ({
  folderName,
  onRunClick,
  setShowReportList,
}: TestingHeaderProps) => {
  const { t } = useTranslation();
  const testingSendingData = useTesting((store) => store?.testingSendingData);

  const renderRunBtnText = useMemo(() => {
    switch (testingSendingData.sendStatus) {
      case "initial":
        return t("test.steps_page.run");
      case "sending":
        return t("report_list.close_tip.stop");
      case "sendOver":
        return t("common.start_over");
      default:
        return t("test.steps_page.run");
    }
  }, [testingSendingData.sendStatus]);

  return (
    <Flex justify="space-between">
      <Flex align="center" gap={12}>
        <div className={styles.folderName}>{folderName}</div>
        <div
          className={styles.historyReport}
          onClick={() => {
            setShowReportList(true);
          }}
        >
          {t("common.folder_operate.history_report")}
        </div>
      </Flex>
      <Button
        className={clsx({
          [styles.folderSendingBtn]:
            testingSendingData.sendStatus === "sending",
        })}
        type="primary"
        onClick={onRunClick}
      >
        {renderRunBtnText}
      </Button>
    </Flex>
  );
};
export default TestingHeader;
