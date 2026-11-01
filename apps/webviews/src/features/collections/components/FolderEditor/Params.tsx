import styles from "./Params.module.css";
import { FC } from "react";

import FolderParamsSettings from "@/features/collections/components/FolderSettings/ParamsSettings";
import { FolderEditorProps } from "@onapi/domain/requests/record";

const Params: FC<FolderEditorProps> = ({ apisData, onApisDataChange }) => {
  return (
    <div className={styles.container}>
      <FolderParamsSettings value={apisData} onChange={onApisDataChange} />
    </div>
  );
};

export default Params;
