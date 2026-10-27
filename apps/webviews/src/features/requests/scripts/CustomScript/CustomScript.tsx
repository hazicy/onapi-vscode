import styles from "./CustomScript.module.css";
import { useEffect, useRef, useState } from "react";

import classNames from "classnames";
import { map } from "lodash-es";

import Tooltip from "@/shared/ui/Tooltip";

import CodeEditor from "../../../../shared/components/CodeEditor/CodeEditor";
import { ASSERT_LIST, SCRIPT_LIST, SCRIPT_TYPE } from "./constants";

type CustomScriptProps = {
  mode: SCRIPT_TYPE;
  value: string;
  onChange: (value: string) => void;
};

type VarItem = {
  item: {
    name: string;
    value: string;
  };
  value: CustomScriptProps["value"];
  onClick: () => void;
};

const VarItem = ({ item, value, onClick }: VarItem) => {
  const itemRef = useRef<HTMLDivElement>(null);

  const [isEllipsis, setIsEllipsis] = useState(false);

  useEffect(() => {
    const checkEllipsis = () => {
      const element = itemRef.current;
      if (element) {
        const isEllipsis = element.offsetWidth < element.scrollWidth;
        setIsEllipsis(isEllipsis);
      }
    };

    checkEllipsis();
  }, []);

  return (
    <div
      ref={itemRef}
      className={classNames(styles.varItem, {
        [styles.active]: item.value === value,
      })}
      onClick={onClick}
    >
      {isEllipsis ? (
        <Tooltip placement="topLeft" title={item.name}>
          {item.name}
        </Tooltip>
      ) : (
        item.name
      )}
    </div>
  );
};

const CustomScript = ({ mode, value, onChange }: CustomScriptProps) => {
  const handleOnChange = (val: string) => {
    if (value === "") {
      onChange(val);
    } else {
      onChange(`${value}\n${val}`);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.customScriptContainer}>
        <div className={styles.codeEditorContainer}>
          <CodeEditor language="javascript" value={value} onChange={onChange} />
        </div>
        <div className={styles.rightVarList}>
          {map(
            mode === SCRIPT_TYPE.ASSERT ? ASSERT_LIST : SCRIPT_LIST,
            (item) => {
              return (
                <VarItem
                  key={item.value}
                  item={item}
                  value={value}
                  onClick={() => handleOnChange(item.value)}
                />
              );
            },
          )}
        </div>
      </div>
    </div>
  );
};

export default CustomScript;
