import styles from "./NewJsonView.module.css";
import classNames from "classnames";
import { CSSProperties, FC, useMemo } from "react";
import ReactJson from "@microlink/react-json-view";

import { isPlainObject, isString } from "lodash";

import { useSystemConfig } from "@/app/store";
import { copyStringToClipboard } from "@/shared/utils/common";
import JSON5 from "json5";

const reactJsonStyle = {
  fontSize: "12px",
  height: "100%",
  overflow: "auto",
  backgroundColor: "transparent",
  fontFamily: "inherit",
};

interface Props {
  value: any;
  wrapStyle?: CSSProperties;
  wrapClassName?: string;
}

const NewJsonView: FC<Props> = ({ value, wrapStyle, wrapClassName }) => {
  const { bg_color } = useSystemConfig((state) => state.systemConfig);

  const jsonView = useMemo(() => {
    let result = {
      isJson: true,
      view: {},
    };

    if (isString(value) && value.length > 0) {
      try {
        const tempObj = JSON5.parse(value);
        result = isPlainObject(tempObj)
          ? {
              isJson: true,
              view: tempObj,
            }
          : { isJson: false, view: value };
      } catch (e) {
        result = {
          isJson: false,
          view: value,
        };
      }
    }
    if (isPlainObject(value)) {
      result = {
        isJson: true,
        view: value,
      };
    }
    return result;
  }, [value]);

  const handleCopyClipboard = (copyObj: any) => {
    const { name, src } = copyObj;

    let copyVal = null;

    try {
      if (!name) {
        copyVal = JSON.stringify(src);
      } else if (isString(name)) {
        copyVal = JSON.stringify({
          [name]: src,
        });
      }

      copyStringToClipboard(copyVal as string);
    } catch (e) {}
  };

  return (
    <div
      style={wrapStyle}
      className={classNames(styles.container, wrapClassName)}
    >
      {jsonView.isJson ? (
        <ReactJson
          src={jsonView.view}
          enableClipboard={handleCopyClipboard}
          name={false}
          theme={
            ["white", "orange"].includes(bg_color) ? "rjv-default" : "eighties"
          }
          indentWidth={2}
          style={reactJsonStyle}
          displayDataTypes={false}
          collapsed={1}
        />
      ) : (
        <div className={styles.otherPreView}>{jsonView.view as string}</div>
      )}
    </div>
  );
};

export default NewJsonView;
