import styles from "./JsonSchema.module.css";
import React, { memo } from "react";

import HeaderAction from "./HeaderAction/HeaderAction";
import JsonSchemaTable from "./JsonSchemaTable/JsonSchemaTable";

type Props = {
  value?: any;
  onChange?: (newVal: any) => void;
  onBeforeLink?: (refKeys: string[]) => boolean;
  model_id?: string;
  importTitle?: string;
  isShowHeaderAction?: boolean;
  models?: any;
};

const Index: React.FC<Props> = (props) => {
  const {
    value,
    onChange = () => {},
    importTitle,
    models,
    model_id,
    isShowHeaderAction = true,
  } = props;

  return (
    <div className={styles.container}>
      {isShowHeaderAction && (
        <HeaderAction
          style={{ display: isShowHeaderAction ? "none" : "block" }}
          value={value}
          onChange={onChange}
          importTitle={importTitle}
        />
      )}
      <JsonSchemaTable
        model_id={model_id}
        models={models}
        value={value}
        onChange={onChange}
      />
    </div>
  );
};

export default memo(Index);
