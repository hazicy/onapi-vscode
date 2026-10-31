import styles from "./VarMentions.module.css";
import React, { useEffect, useRef } from "react";
import ReactDOM from "react-dom";
import { useTranslation } from "react-i18next";

import type { VariableEntry } from "@onapi/domain/variables/context";
import clsx from "clsx";

import {
  variableDisplayText,
  variableScopeLabel,
} from "../utils/variable-display";

interface EnvVarsProps {
  offset?: React.CSSProperties;
  items: VariableEntry[];
  activeIndex: number;
  onActiveChange: (index: number) => void;
  onSelect?: (newVal: string) => void;
}

const EnvVar = (props: EnvVarsProps) => {
  const { t } = useTranslation();
  const { offset, items, activeIndex, onActiveChange, onSelect } = props;
  const listRef = useRef<HTMLDivElement>(null);
  const currentItem = items[activeIndex];

  useEffect(() => {
    listRef.current?.children[activeIndex]?.scrollIntoView({
      block: "nearest",
    });
  }, [activeIndex, items]);

  const handleSelectMarkItem = (
    key: string,
    event: React.MouseEvent<HTMLDivElement>,
  ) => {
    event.stopPropagation();
    event.preventDefault();
    onSelect?.(key);
  };

  return ReactDOM.createPortal(
    <div className={styles.container}>
      <div className={styles.relatedEnvVars} style={offset}>
        <div
          className={styles.envVarsList}
          ref={listRef}
          role="listbox"
          aria-label={t("supplement.var_name")}
        >
          {!items.length && (
            <div role="status">{t("interaction.noMatchingVariables")}</div>
          )}
          {items.map((item, index) => (
            <div
              key={item.name}
              role="option"
              aria-selected={activeIndex === index}
              className={clsx(styles.envVarsDefault, {
                [styles.active]: activeIndex === index,
              })}
              onFocus={onActiveChange.bind(null, index)}
              onMouseOver={onActiveChange.bind(null, index)}
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
        {currentItem && (
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
        )}
      </div>
    </div>,
    document.body,
  );
};

export default EnvVar;
