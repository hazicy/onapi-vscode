import styles from "./VersionComparison.module.css";

import { Flex } from "@/shared/ui/base";

import ApisDiffJsonContent from "@/features/sync/components/ApisDiffJsonContent/ApisDiffJsonContent";
import { Modal } from "@/shared/ui/Modal";

import { EnvListItem } from "@onapi/domain/environment/types/index";

interface Props {
  curItem: {
    localEnv: EnvListItem;
    cloudEnv: EnvListItem;
  };
  open: boolean;
  onCancel: () => void;
}

const VersionComparison = (props: Props) => {
  const { curItem, open, onCancel } = props || {};

  return (
    <Modal
      title={"Push Environment Conflict Comparison"}
      onCancel={onCancel}
      footer={null}
      open={open}
      width={880}
    >
      <div className={styles.container}>
        <Flex vertical gap={16}>
          <Flex align="center" gap={16} justify="space-between">
            <span className={styles.versionTip}>{"Local Data"}</span>
            <span className={styles.versionTip}>{"Cloud Data"}</span>
          </Flex>
          <ApisDiffJsonContent
            prevDetails={curItem?.localEnv}
            nextDetails={curItem?.cloudEnv}
          />
        </Flex>
      </div>
    </Modal>
  );
};

export default VersionComparison;
