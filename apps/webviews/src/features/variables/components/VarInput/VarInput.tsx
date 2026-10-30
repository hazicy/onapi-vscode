import React, { useId, useMemo, useRef } from "react";
import { useTranslation } from "react-i18next";

import { Input, Tooltip, message } from "@/shared/ui/base";
import type { InputRef } from "@/shared/ui/base";
import VarMentions from "@/features/variables/components/VarMentions";
import useProjectConfig from "@/features/project/store/useProjectConfig";
import { useSafeState } from "ahooks";
import clsx from "clsx";
import { head } from "lodash-es";

import { parseSafeBash } from "@/features/curl/utils/curl";
import type { CurlDataType } from "@/features/requests/types/other";

import styles from "./VarInput.module.css";
import { getElementTextOffset } from "./util";
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

type EnvOptions = {
  offset: Pick<React.CSSProperties, "left" | "top">;
  insertionIndex: number;
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
  const inputRef = useRef<InputRef>(null);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const nativeMaxLength =
    maxLength !== undefined && maxLength <= 2147483647 ? maxLength : undefined;
  const editorElement = () =>
    multiline ? textAreaRef.current : inputRef.current?.input || null;

  const insertVariable = (name: string) => {
    const element = editorElement();
    if (!element || !completion || readOnly) {
      return;
    }
    const text = `${name}}}`;
    const start = completion.insertionIndex;
    const nextValue = `${element.value.slice(0, start)}${text}${element.value.slice(start)}`;
    if (nextValue.length > maxLength) {
      return;
    }
    onChange?.(nextValue);
    requestAnimationFrame(() => {
      const current = editorElement();
      current?.focus();
      current?.setSelectionRange(start + text.length, start + text.length);
    });
  };

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const element = event.currentTarget;
    onChange?.(element.value);
    const index = element.selectionStart ?? element.value.length;
    if (envVisible || element.value.slice(index - 2, index) !== "{{") {
      setCompletion(null);
      return;
    }
    const position = getElementTextOffset(element, index);
    setCompletion({
      offset: { left: position.left, top: position.top },
      insertionIndex: index,
    });
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
      onChange?.(nextValue);
      requestAnimationFrame(() => {
        const current = editorElement();
        current?.setSelectionRange(
          selectionStart + inserted.length,
          selectionStart + inserted.length,
        );
      });
      return;
    }

    event.preventDefault();
    const pastedValue = element.value;
    element.blur();
    try {
      const [{ fromCurlPostmanRequest }, { convert, validate }] =
        await Promise.all([
          import("@onapi/domain/curl/utils/postman-request"),
          import("curl-to-postmanv2"),
        ]);
      // Loading the converter must not overwrite edits made while it was loading.
      if (element.value !== pastedValue || !element.isConnected) {
        return;
      }
      const { result: isCurl = false } = validate(bashText);
      if (!isCurl) {
        message.destroy();
        message.info(t("supplement.curl_tip"));
        return;
      }
      convert({ type: "string", data: bashText }, (error: any, result: any) => {
        if (error || (result?.error && !result?.result)) {
          message.destroy();
          message.info(t("supplement.curl_tip"));
          return;
        }
        const newApi = fromCurlPostmanRequest(head<any>(result?.output)?.data);
        if (!newApi) {
          return;
        }
        if (!newApi.request) {
          return;
        }
        pasteCurlChange?.({ request: newApi.request });
      });
    } catch {
      message.destroy();
      message.info(t("supplement.curl_tip"));
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    onKeyDown?.(event, envVisible);
    if (event.key === "Enter" && (disabledReturn || envVisible)) {
      event.preventDefault();
    }
    if (envVisible && (event.key === "ArrowUp" || event.key === "ArrowDown")) {
      event.preventDefault();
    }
    if (event.key === "Escape" && envVisible) {
      setCompletion(null);
    }
  };

  const handleBlur = (event: React.FocusEvent<HTMLDivElement>) => {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
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
          onSelect={insertVariable}
          onCancel={() => setTimeout(() => setCompletion(null), 100)}
          offset={completion.offset}
          env_id={currentEnvId}
        />
      )}
    </div>
  );
}
