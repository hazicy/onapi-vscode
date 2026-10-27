import styles from "./VersionComparison.module.css";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";

import { Flex } from "@/shared/ui/base";

import { useSafeState } from "ahooks";

import { isObject } from "lodash-es";

import ApisDiffJsonContent from "@/features/sync/components/ApisDiffJsonContent/ApisDiffJsonContent";
import { Modal } from "@/shared/ui/Modal";

import { EnvListItem } from "@onapi/http-model/environment/types/index";

interface Props {
  curItem: {
    localEnv: EnvListItem;
    cloudEnv: EnvListItem;
  };
  open: boolean;
  onCancel: () => void;
}

const VersionComparison = (props: Props) => {
  const { t } = useTranslation();
  const { curItem, open, onCancel } = props || {};

  const [modal, contextHolder] = Modal.useModal();

  const [prevDetails, setPrevDetails] = useSafeState<any>();
  const [nextDetails, setNextDetails] = useSafeState<any>();
  useEffect(() => {
    if (isObject(curItem?.localEnv) && isObject(curItem?.cloudEnv)) {
      setPrevDetails(curItem?.localEnv);
      setNextDetails(curItem?.cloudEnv);
    }
  }, [curItem]);
  return (
    <Modal
      title={"Push Environment Conflict Comparison"}
      onCancel={onCancel}
      footer={null}
      open={open}
      width={880}
    >
      {contextHolder}
      <div className={styles.container}>
        <Flex vertical gap={16}>
          <Flex align="center" gap={16} justify="space-between">
            <span className={styles.versionTip}>{"Local Data"}</span>
            <span className={styles.versionTip}>{"Cloud Data"}</span>
          </Flex>
          <ApisDiffJsonContent
            prevDetails={prevDetails}
            nextDetails={nextDetails}
          />
        </Flex>
      </div>
    </Modal>
  );
};

export default VersionComparison;
