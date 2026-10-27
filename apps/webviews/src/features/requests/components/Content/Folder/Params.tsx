import styles from "./Params.module.css";
import { FC } from "react";

import FolderParamsSettings from "@/features/collections/components/FolderSettings/ParamsSettings";
import { FolderComponentType } from "@onapi/http-model/requests/types/folder";

const Params: FC<FolderComponentType> = ({ apisData, onApisDataChange }) => {
  return (
    <div className={styles.container}>
      <FolderParamsSettings value={apisData} onChange={onApisDataChange} />
    </div>
  );
};

export default Params;
