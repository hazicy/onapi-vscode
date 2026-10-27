import styles from "./ParamsSettings.module.css";
import { FC } from "react";

import { useMemoizedFn } from "ahooks";

import RequestGlobal from "@/features/requests/editor/RequestGlobal";
import { FolderDetailsData } from "@onapi/http-model/requests/types/folder";

interface Props {
  value: FolderDetailsData;
  onChange: (value: FolderDetailsData) => void;
}

const ParamsSettings: FC<Props> = ({ value, onChange }) => {
  return (
    <div className={styles.container}>
      <RequestGlobal item={value} onItemChange={onChange} />
    </div>
  );
};

export default ParamsSettings;
