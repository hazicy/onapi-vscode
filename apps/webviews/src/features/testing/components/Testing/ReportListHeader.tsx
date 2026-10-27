import styles from "./ReportListHeader.module.css";
import { Flex } from "@/shared/ui/base";
import AppIcon from "@/shared/ui/AppIcon";

type TestingHeaderProps = {
  folderName: string;
  setShowReportList: (val: boolean) => void;
};

const ReportListHeader = ({
  folderName,
  setShowReportList,
}: TestingHeaderProps) => {
  return (
    <div className={styles.container}>
      <Flex align="center" gap={6}>
        <AppIcon
          style={{ fontSize: 20 }}
          icon="arrow-left"
          onClick={() => setShowReportList(false)}
        />
        <div>{folderName}</div>
      </Flex>
    </div>
  );
};
export default ReportListHeader;
