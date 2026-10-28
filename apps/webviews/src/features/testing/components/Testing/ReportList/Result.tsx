import { useTranslation } from "react-i18next";
import Drawer from "@/shared/ui/Drawer";
import { Modal } from "@/shared/ui/Modal";
import TestingMain from "../Main/Main";

type ResultProps = {
  /** Report data to open */
  data: any;
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
        title={data?.folderName || t("report_detail.title")}
        open={open}
        onClose={() => handleOnClose()}
      >
        <TestingMain
          is_report={true}
          testingSendingData={{
            sendStatus: "sendOver",
            requestList: data?.requestList || [],
            complete: data?.complete || {},
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
