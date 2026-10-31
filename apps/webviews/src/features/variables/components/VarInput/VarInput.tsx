import React, { useId, useLayoutEffect, useMemo, useRef } from "react";
import { useTranslation } from "react-i18next";

import { Input, Tooltip, message } from "@/shared/ui/base";
import type { InputRef } from "@/shared/ui/base";
import VarMentions from "@/features/variables/components/VarMentions";
import useProjectConfig from "@/features/project/store/useProjectConfig";
import { useSafeState } from "ahooks";
import clsx from "clsx";
import { importPastedCurl } from "@/features/curl/utils/import-pasted-curl";

import { parseSafeBash } from "@/features/curl/utils/curl";
import type { CurlDataType } from "@/features/requests/types/other";

import styles from "./VarInput.module.css";
import { getElementTextOffset } from "./util";
import {
  findVariableCompletion,
  completeVariable,
  type VariableCompletion,
} from "./completion";
import {
  variableContext,
  variableDisplay,
  variableDisplayText,
} from "../../utils/variable-display";

interface VarInputProps {
  envId?: string;
  value: string;
  readOnly: boolean;
  multiline: boolean;
  placeholder: string;
  hasBorder: boolean;
  suffix: React.ReactNode;
  maxLength?: number;
  onChange: (val: string) => void;
  onBlur?: (val: string) => void;
  onKeyDown?: (
    event: React.KeyboardEvent<HTMLDivElement>,
    isEnvOpen?: boolean,
  ) => void;
  pasteCurlChange?: (d: CurlDataType) => void;
  wrapClassName?: string;
  disabledReturn?: boolean;
}

type EnvOptions = VariableCompletion & {
  offset: Pick<React.CSSProperties, "left" | "top">;
  activeIndex: number;
};

export default function VarInput(props: Partial<VarInputProps>) {
  const {
    envId = "",
    value = "",
    multiline = false,
    hasBorder = false,
    readOnly,
    placeholder,
    suffix,
    maxLength = 2048,
    onChange,
    onBlur,
    onKeyDown,
    pasteCurlChange,
    wrapClassName,
    disabledReturn,
  } = props;
  const { t } = useTranslation();
  const http = useProjectConfig((state) => state.http);
  const currentEnvId = envId || http.activeEnvironment || "";
  const values = useMemo(
    () => variableContext(http, currentEnvId),
    [http, currentEnvId],
  );
  const matches = [...value.matchAll(/\{\{([^{}\n]+)\}\}/g)];
  const names = [...new Set(matches.map((match) => match[1]))];
  const [scroll, setScroll] = useSafeState({ left: 0, top: 0 });
  const syncScroll = (
    event: React.UIEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setScroll({
      left: event.currentTarget.scrollLeft,
      top: event.currentTarget.scrollTop,
    });
  };
  const previewId = useId();
  const preview = names.length ? (
    <div id={previewId} role="tooltip" className={styles.variablePreview}>
      <div className={styles.previewHeading}>
        {t("interaction.configuredValue")}
      </div>
      {names.map((name) => {
        const variable = variableDisplay(name, values);
        return (
          <div key={name} className={styles.previewRow}>
            <code
              className={
                variable.kind === "undefined"
                  ? styles.undefinedVariable
                  : undefined
              }
            >
              {`{{${name}}}`}
            </code>
            <div className={styles.previewValue}>
              {variableDisplayText(variable, t)}
            </div>
          </div>
        );
      })}
    </div>
  ) : undefined;
  const highlighted = [];
  let previousEnd = 0;
  for (const match of matches) {
    highlighted.push(value.slice(previousEnd, match.index));
    highlighted.push(
      <mark
        key={match.index}
        className={clsx(styles.variable, {
          [styles.undefinedVariable]:
            variableDisplay(match[1], values).kind === "undefined",
        })}
      >
        {match[0]}
      </mark>,
    );
    previousEnd = match.index! + match[0].length;
  }
  highlighted.push(value.slice(previousEnd), "\u200b");
  const [completion, setCompletion] = useSafeState<EnvOptions | null>(null);
  const envVisible = completion !== null;
  const candidates = useMemo(
    () =>
      [...values.values()].filter((entry) =>
        entry.name
          .toLowerCase()
          .includes(completion?.query.toLowerCase() ?? ""),
      ),
    [values, completion?.query],
  );
  const inputRef = useRef<InputRef>(null);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const pendingCaret = useRef<{
    position: number;
    refreshCompletion: boolean;
  } | null>(null);
  const nativeMaxLength =
    maxLength !== undefined && maxLength <= 2147483647 ? maxLength : undefined;
  const editorElement = () =>
    multiline ? textAreaRef.current : inputRef.current?.input || null;

  useLayoutEffect(() => {
    if (pendingCaret.current === null) {
      return;
    }
    const { position, refreshCompletion } = pendingCaret.current;
    pendingCaret.current = null;
    const element = editorElement();
    element?.focus();
    element?.setSelectionRange(position, position);
    if (element && refreshCompletion) {
      updateCompletion(element);
    }
  });

  const insertVariable = (name: string) => {
    const element = editorElement();
    if (!element || !completion || readOnly) {
      return;
    }
    const edit = completeVariable(element.value, completion, name);
    if (edit.value.length > maxLength) {
      return;
    }
    pendingCaret.current = { position: edit.caret, refreshCompletion: false };
    onChange?.(edit.value);
    setCompletion(null);
  };

  const updateCompletion = (
    element: HTMLInputElement | HTMLTextAreaElement,
  ) => {
    const index = element.selectionStart ?? element.value.length;
    const range = findVariableCompletion(
      element.value,
      index,
      element.selectionEnd ?? index,
    );
    if (readOnly || !range) {
      setCompletion(null);
      return;
    }
    const position = getElementTextOffset(element, index);
    setCompletion({
      ...range,
      offset: { left: position.left, top: position.top },
      activeIndex: 0,
    });
  };

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    onChange?.(event.currentTarget.value);
    updateCompletion(event.currentTarget);
  };

  const handlePaste = async (
    event: React.ClipboardEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const text = event.clipboardData.getData("text/plain");
    const element = event.currentTarget;
    const selectionStart = element.selectionStart ?? element.value.length;
    const selectionEnd = element.selectionEnd ?? selectionStart;
    const available =
      maxLength - (element.value.length - (selectionEnd - selectionStart));
    if (text.length > available) {
      event.preventDefault();
      message.destroy();
      message.info(t("supplement.overflow_str"));
      return;
    }

    const bashText = parseSafeBash(text);
    if (!bashText.trim().toLocaleLowerCase().startsWith("curl")) {
      event.preventDefault();
      const inserted = text.replace(/\n/g, " ");
      const nextValue = `${element.value.slice(0, selectionStart)}${inserted}${element.value.slice(selectionEnd)}`;
      pendingCaret.current = {
        position: selectionStart + inserted.length,
        refreshCompletion: true,
      };
      onChange?.(nextValue);
      return;
    }

    event.preventDefault();
    const pastedValue = element.value;
    element.blur();
    const isCurrent = () =>
      element.value === pastedValue && element.isConnected;
    try {
      const request = await importPastedCurl(bashText);
      if (isCurrent() && request) {
        pasteCurlChange?.(request);
      }
    } catch {
      if (isCurrent()) {
        message.destroy();
        message.info(t("supplement.curl_tip"));
      }
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.nativeEvent.isComposing) {
      return;
    }
    if (
      completion &&
      ["ArrowUp", "ArrowDown", "Enter", "Escape"].includes(event.key)
    ) {
      event.preventDefault();
      event.stopPropagation();
      if (event.key === "Escape") {
        setCompletion(null);
      } else if (event.key === "Enter") {
        const candidate = candidates[completion.activeIndex];
        if (candidate) {
          insertVariable(candidate.name);
        }
      } else {
        const direction = event.key === "ArrowDown" ? 1 : -1;
        const activeIndex = Math.max(
          0,
          Math.min(completion.activeIndex + direction, candidates.length - 1),
        );
        setCompletion({ ...completion, activeIndex });
      }
      return;
    }
    onKeyDown?.(event, envVisible);
    if (event.key === "Enter" && disabledReturn) {
      event.preventDefault();
    }
  };

  const handleBlur = (event: React.FocusEvent<HTMLDivElement>) => {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
      setCompletion(null);
      onBlur?.(value);
    }
  };

  const fieldProps = {
    className: styles.editorField,
    value,
    placeholder,
    "aria-describedby": names.length ? previewId : undefined,
    readOnly,
    maxLength: nativeMaxLength,
    onChange: handleChange,
    onSelect: (
      event: React.SyntheticEvent<HTMLInputElement | HTMLTextAreaElement>,
    ) => {
      if (completion) {
        updateCompletion(event.currentTarget);
      }
    },
    onScroll: syncScroll,
    onPaste: handlePaste,
  };

  return (
    <div
      onKeyDown={handleKeyDown}
      onBlur={handleBlur}
      className={clsx(
        styles.container,
        { [styles.hasBorder]: hasBorder },
        wrapClassName,
      )}
    >
      <div className={styles.editorShell}>
        <Tooltip
          title={envVisible ? undefined : preview}
          placement="bottomLeft"
        >
          <div
            className={clsx(styles.fieldShell, {
              [styles.highlighted]: matches.length > 0,
              [styles.multiline]: multiline,
            })}
          >
            {matches.length > 0 && (
              <div className={styles.highlights} aria-hidden="true">
                <div
                  style={{
                    transform: `translate(${-scroll.left}px, ${-scroll.top}px)`,
                  }}
                >
                  {highlighted}
                </div>
              </div>
            )}
            {multiline ? (
              <Input.TextArea {...fieldProps} ref={textAreaRef} rows={1} />
            ) : (
              <Input {...fieldProps} ref={inputRef} bordered={false} />
            )}
          </div>
        </Tooltip>
        {suffix}
      </div>
      {completion && (
        <VarMentions
          items={candidates}
          activeIndex={completion.activeIndex}
          onActiveChange={(activeIndex) =>
            setCompletion({ ...completion, activeIndex })
          }
          onSelect={insertVariable}
          offset={completion.offset}
        />
      )}
    </div>
  );
}
