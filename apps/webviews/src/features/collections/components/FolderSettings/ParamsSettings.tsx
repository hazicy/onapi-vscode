import styles from "./ParamsSettings.module.css";
import { FC } from "react";

import RequestGlobal from "@/features/requests/editor/RequestGlobal";
import { FolderDetailsData } from "@onapi/domain/requests/types/folder";

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
