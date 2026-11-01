import styles from "./ParamsSettings.module.css";
import { FC } from "react";

import RequestGlobal from "@/features/requests/editor/RequestGlobal";
import { FolderEditorRecord } from "@onapi/domain/requests/record";

interface Props {
  value: FolderEditorRecord;
  onChange: (value: FolderEditorRecord) => void;
}

const ParamsSettings: FC<Props> = ({ value, onChange }) => {
  return (
    <div className={styles.container}>
      <RequestGlobal item={value} onItemChange={onChange} />
    </div>
  );
};

export default ParamsSettings;
