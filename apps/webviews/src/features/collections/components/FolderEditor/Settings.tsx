import styles from "./Settings.module.css";
import { FC } from "react";

import FolderBaseSettings from "@/features/collections/components/FolderSettings/BaseSettings/BaseSettings";
import { FolderEditorProps } from "@onapi/domain/requests/record";

const Settings: FC<FolderEditorProps> = ({ apisData, onApisDataChange }) => {
  return (
    <div className={styles.container}>
      <FolderBaseSettings value={apisData} onChange={onApisDataChange} />
    </div>
  );
};

export default Settings;
