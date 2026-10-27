import styles from "./Settings.module.css";
import { FC } from "react";

import FolderBaseSettings from "@/features/collections/components/FolderSettings/BaseSettings/BaseSettings";
import { FolderComponentType } from "@onapi/http-model/requests/types/folder";

const Settings: FC<FolderComponentType> = ({ apisData, onApisDataChange }) => {
  return (
    <div className={styles.container}>
      <FolderBaseSettings value={apisData} onChange={onApisDataChange} />
    </div>
  );
};

export default Settings;
