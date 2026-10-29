import type { TestingReportList } from "@onapi/contracts";
import { useTranslation } from "react-i18next";
import Drawer from "@/shared/ui/Drawer";
import { Modal } from "@/shared/ui/Modal";
import TestingMain from "../Main/Main";

type ResultProps = {
  /** Report data to open */
  data: TestingReportList;
  /** Whether the drawer is open */
  open: boolean;
  /** Close event handler */
  onClose: () => void;
};

const Result = ({ data, open, onClose }: ResultProps) => {
  const { t } = useTranslation();
  const [, contextHolder] = Modal.useModal();

  const handleOnClose = () => {
    onClose();
  };

  return (
    <>
      <Drawer
        destroyOnClose
        title={data.report_name || t("report_detail.title")}
        open={open}
        onClose={() => handleOnClose()}
      >
        <TestingMain
          is_report={true}
          testingSendingData={{
            sendStatus: "sendOver",
            events: data.events,
            startedAt: data.startedAt,
            finishedAt: data.finishedAt,
            environmentName: data.environmentName,
          }}
          testingConfig={data.testingConfig}
          eventList={[]}
          eventAllCount={data?.eventAllCount}
        />
      </Drawer>
      {contextHolder}
    </>
  );
};

export default Result;
