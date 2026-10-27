import styles from "./VarMentions.module.css";
import React, { useEffect, useMemo, useRef } from "react";
import ReactDOM from "react-dom";
import { useTranslation } from "react-i18next";

import { useMemoizedFn, useSafeState } from "ahooks";
import cn from "classnames";
import { isFunction, isObject, isUndefined, map } from "lodash-es";

import { SYSTEM_VARS } from "@/shared/constants/system";
import useProjectConfig from "@/features/project/store/useProjectConfig";

const envVarMarkVarsList = [];

interface EnvVarsProps {
  envVisible?: boolean;
  offset?: any;
  onCancel?: () => void;
  onSelect?: (newVal: string) => void;
  env_id: string;
}

const EnvVar = (props: EnvVarsProps) => {
  const { t } = useTranslation();
  const { envVisible, offset, onCancel, onSelect, env_id = "-1" } = props;
  const http = useProjectConfig((state) => state.http);
  const [itemIndex, setItemIndex] = useSafeState(0);
  const refItemIndex = useRef(0);
  const markVarsList = useMemo(() => {
    const environmentId =
      env_id && env_id !== "-1" ? env_id : http?.activeEnvironment;
    const environment = http?.environments.find(
      (scope) => scope.id === environmentId,
    );
    const variables = (
      values: import("postman-collection").VariableDefinition[] | undefined,
      envType: string,
    ) =>
      (values || [])
        .filter((variable) => variable.key && !variable.disabled)
        .map((variable) => ({
          key: variable.key || "",
          value: String(variable.value ?? ""),
          current_value: String(variable.value ?? ""),
          description:
            typeof variable.description === "string"
              ? variable.description
              : variable.description?.content || "",
          envType,
        }));
    return [
      ...variables(environment?.values, "env"),
      ...variables(http?.options.globals.values, "global"),
      ...Object.entries(SYSTEM_VARS).map(([key, description]) => ({
        key: `$${key}`,
        value: `$${key}`,
        current_value: "",
        description,
        envType: "global",
      })),
    ];
  }, [http, env_id]);
  const currentItem = markVarsList[itemIndex];

  const changeActive = (i: number) => {
    let x = 0;
    if (itemIndex !== null) {
      x = itemIndex + i;
    }
    const varDom: HTMLElement | null =
      document.getElementById("scroll-env-vars");
    if (i === 1) {
      const isScroll = varDom && varDom.scrollTop + 8 * 28 < (x + 1) * 28;
      if (isScroll) {
        varDom.scrollTop = (x - 7) * 28;
      }
      if (refItemIndex.current >= 0) {
        refItemIndex.current -= 1;
      }
    }
    if (i === -1) {
      if (refItemIndex.current < 7) {
        refItemIndex.current += 1;
      }
      const isScroll =
        (varDom && varDom.scrollTop === (x - 1) * 28) ||
        x === envVarMarkVarsList.length - 8;
      if (isScroll && varDom) {
        varDom.scrollTop = (x - 2) * 28 >= 0 ? (x - 2) * 28 : 0;
      }
    }

    setItemIndex(x);
  };

  const listener = useMemoizedFn((e) => {
    if (e.code === "ArrowDown") {
      if (itemIndex < markVarsList?.length - 1) {
        changeActive(1);
      }
    }
    if (e.code === "ArrowUp") {
      if (itemIndex > 0) {
        changeActive(-1);
      }
    }
    if (e.code === "Enter") {
      const markItem: {
        key: string;
        value: string;
        envType: string;
        description: string;
      } = markVarsList[itemIndex];

      if (!isUndefined(markItem)) {
        if (isFunction(onSelect)) {
          onSelect(markItem.key);
        }
        setTimeout(() => {
          onCancel && onCancel();
        }, 0);
      }
    }
  });

  useEffect(() => {
    document.addEventListener("keydown", listener, true);
    return () => {
      document.removeEventListener("keydown", listener, true);
    };
  }, []);

  const handleSelectMarkItem = useMemoizedFn(
    (value: string, e: React.MouseEvent<HTMLDivElement>) => {
      e.stopPropagation();
      e.preventDefault();
      onSelect && onSelect(value);
      setTimeout(() => {
        onCancel && onCancel();
      }, 0);
    },
  );

  const calcValue = (value: unknown) => {
    if (isObject(value)) {
      return JSON.stringify(value);
    }

    return `${value}`;
  };

  return (
    <>
      {envVisible &&
        currentItem &&
        ReactDOM.createPortal(
          <div className={styles.container}>
            <div className={styles.relatedEnvVars} style={offset}>
              <div className={styles.envVarsList} id="scroll-env-vars">
                {map(markVarsList, (item: any, index) => (
                  <div
                    key={`${item.key} + ${index}`}
                    className={cn(styles.envVarsDefault, {
                      [styles.active]: itemIndex === index,
                    })}
                    onFocus={setItemIndex.bind(null, index)}
                    onMouseOver={setItemIndex.bind(null, index)}
                    onMouseDown={handleSelectMarkItem.bind(null, item.key)}
                  >
                    <div
                      className={cn(styles.defaultType, {
                        [styles.e]: item?.envType === "env",
                      })}
                    >
                      {item?.envType === "env" ? "E" : "G"}
                    </div>
                    <div
                      className={[styles.defaultName, "text-ellipse2"].join(
                        " ",
                      )}
                    >
                      {item.key}
                    </div>
                    <div className={styles.defaultIcon}></div>
                  </div>
                ))}
              </div>
              <div className={styles.envVarsDesc}>
                <div className="desc-title">{t("supplement.var_name")}</div>
                <div className={styles.varName}>{currentItem.key}</div>
                <div className="desc-title" style={{ margin: "16px 0 0 0" }}>
                  {t("supplement.var_value")}
                </div>
                <div className={styles.varValue}>
                  {calcValue(
                    currentItem?.envType === "env"
                      ? currentItem?.current_value || currentItem?.value
                      : currentItem.description,
                  )}
                </div>
                <div className="desc-title" style={{ margin: "16px 0 0 0" }}>
                  {t("supplement.scope")}
                </div>
                <div className={styles.varValue}>
                  {currentItem?.envType === "env"
                    ? t("supplement.var_env")
                    : t("supplement.var_glo")}
                </div>
              </div>
            </div>
          </div>,
          document.querySelector("body") as HTMLElement,
        )}
    </>
  );
};

export default EnvVar;
