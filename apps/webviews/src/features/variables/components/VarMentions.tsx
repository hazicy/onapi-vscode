import styles from "./VarMentions.module.css";
import React, { useEffect, useMemo, useRef } from "react";
import ReactDOM from "react-dom";
import { useTranslation } from "react-i18next";

import { useMemoizedFn, useSafeState } from "ahooks";
import clsx from "clsx";

import {
  variableContext,
  variableDisplayText,
  variableScopeLabel,
} from "../utils/variable-display";
import useProjectConfig from "@/features/project/store/useProjectConfig";

interface EnvVarsProps {
  offset?: React.CSSProperties;
  onCancel?: () => void;
  onSelect?: (newVal: string) => void;
  env_id: string;
}

const EnvVar = (props: EnvVarsProps) => {
  const { t } = useTranslation();
  const { offset, onCancel, onSelect, env_id = "-1" } = props;
  const http = useProjectConfig((state) => state.http);
  const [itemIndex, setItemIndex] = useSafeState(0);
  const listRef = useRef<HTMLDivElement>(null);
  const markVarsList = useMemo(
    () => [
      ...variableContext(
        http,
        env_id && env_id !== "-1" ? env_id : undefined,
      ).values(),
    ],
    [http, env_id],
  );
  const currentItem = markVarsList[itemIndex];

  useEffect(() => {
    listRef.current?.children[itemIndex]?.scrollIntoView({ block: "nearest" });
  }, [itemIndex]);

  const select = (key: string) => {
    onSelect?.(key);
    setTimeout(() => onCancel?.(), 0);
  };

  const listener = useMemoizedFn((event: KeyboardEvent) => {
    if (event.code === "ArrowDown") {
      setItemIndex(Math.min(itemIndex + 1, markVarsList.length - 1));
    } else if (event.code === "ArrowUp") {
      setItemIndex(Math.max(itemIndex - 1, 0));
    } else if (event.code === "Enter" && currentItem) {
      select(currentItem.name);
    }
  });

  useEffect(() => {
    document.addEventListener("keydown", listener, true);
    return () => {
      document.removeEventListener("keydown", listener, true);
    };
  }, []);

  const handleSelectMarkItem = (
    key: string,
    event: React.MouseEvent<HTMLDivElement>,
  ) => {
    event.stopPropagation();
    event.preventDefault();
    select(key);
  };

  if (!currentItem) {
    return null;
  }

  return ReactDOM.createPortal(
    <div className={styles.container}>
      <div className={styles.relatedEnvVars} style={offset}>
        <div className={styles.envVarsList} ref={listRef}>
          {markVarsList.map((item, index) => (
            <div
              key={`${item.name} + ${index}`}
              className={clsx(styles.envVarsDefault, {
                [styles.active]: itemIndex === index,
              })}
              onFocus={setItemIndex.bind(null, index)}
              onMouseOver={setItemIndex.bind(null, index)}
              onMouseDown={handleSelectMarkItem.bind(null, item.name)}
            >
              <div
                className={clsx(styles.defaultType, {
                  [styles.e]: item.scope === "environment",
                })}
              >
                {item.scope === "environment"
                  ? "E"
                  : item.scope === "collection"
                    ? "C"
                    : item.scope === "system"
                      ? "S"
                      : "G"}
              </div>
              <div className={[styles.defaultName, "text-ellipse2"].join(" ")}>
                {item.name}
              </div>
              <div className={styles.defaultIcon}></div>
            </div>
          ))}
        </div>
        <div className={styles.envVarsDesc}>
          <div className="desc-title">{t("supplement.var_name")}</div>
          <div className={styles.varName}>{currentItem.name}</div>
          <div className="desc-title" style={{ margin: "16px 0 0 0" }}>
            {t("interaction.configuredValue")}
          </div>
          <div className={styles.varValue}>
            {variableDisplayText(currentItem, t)}
          </div>
          <div className="desc-title" style={{ margin: "16px 0 0 0" }}>
            {t("supplement.scope")}
          </div>
          <div className={styles.varValue}>
            {variableScopeLabel(currentItem.scope, t)}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
};

export default EnvVar;
