import React, { useMemo, useRef } from "react";
import { useTranslation } from "react-i18next";

import { Input, message } from "@/shared/ui/base";
import type { InputRef } from "@/shared/ui/base";
import VarMentions from "@/features/variables/components/VarMentions";
import useProjectConfig from "@/features/project/store/useProjectConfig";
import { useMemoizedFn, useSafeState } from "ahooks";
import cn from "classnames";
import { find, head } from "lodash-es";
import { useShallow } from "zustand/react/shallow";

import {
  genUrlByQuery,
  getParameterDataFilterContentLength,
} from "@/features/requests/utils/apis";
import { parseSafeBash } from "@/features/curl/utils/curl";
import type { CurlDataType } from "@/features/requests/types/other";

import styles from "./VarInput.module.css";
import { getElementTextOffset } from "./util";

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
  offset?: Partial<React.CSSProperties>;
  secondLastChar?: number;
  text?: string;
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
  const activeEnvironment = useProjectConfig(
    (state) => state.http.activeEnvironment,
  );
  const currentEnvId = envId || activeEnvironment || "";
  const [envVisible, setEnvVisible] = useSafeState(false);
  const [envObj, setEnvObj] = useSafeState<EnvOptions | null>(null);
  const [active, setActive] = useSafeState(false);
  const inputRef = useRef<InputRef>(null);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const nativeMaxLength =
    maxLength !== undefined && maxLength <= 2147483647 ? maxLength : undefined;
  const editorElement = () =>
    multiline ? textAreaRef.current : inputRef.current?.input || null;

  const handleInput = useMemoizedFn(
    (
      text: string,
      charIndex: number,
      element: HTMLInputElement | HTMLTextAreaElement,
    ) => {
      if (envVisible || text.substring(charIndex - 2, charIndex) !== "{{") {
        setEnvVisible(false);
        return;
      }
      const position = getElementTextOffset(element, charIndex);
      setEnvObj({
        offset: { left: position.left, top: position.top },
        secondLastChar: charIndex - 2,
        text,
      });
      setEnvVisible(true);
    },
  );

  const insertText = useMemoizedFn((text: string, index?: number) => {
    const element = editorElement();
    if (!element || readOnly) {
      return;
    }
    const start = index ?? element.selectionStart ?? element.value.length;
    const end = index === undefined ? (element.selectionEnd ?? start) : start;
    const nextValue = `${element.value.slice(0, start)}${text}${element.value.slice(end)}`;
    if (nextValue.length > (maxLength ?? 2048)) {
      return;
    }
    onChange?.(nextValue);
    requestAnimationFrame(() => {
      const current = editorElement();
      if (!current) {
        return;
      }
      current.focus();
      current.setSelectionRange(start + text.length, start + text.length);
    });
  });

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const element = event.currentTarget;
    onChange?.(element.value);
    handleInput(
      element.value,
      element.selectionStart ?? element.value.length,
      element,
    );
  };

  const handlePaste = async (
    event: React.ClipboardEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const text = event.clipboardData.getData("text/plain");
    const element = event.currentTarget;
    const selectionStart = element.selectionStart ?? element.value.length;
    const selectionEnd = element.selectionEnd ?? selectionStart;
    const available =
      (maxLength ?? 2048) -
      (element.value.length - (selectionEnd - selectionStart));
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
          import("@onapi/http-model/curl/utils/postman-request"),
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
      setEnvVisible(false);
    }
  };

  const handleBlur = (event: React.FocusEvent<HTMLDivElement>) => {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
      setActive(false);
      onBlur?.(value);
    }
  };

  return (
    <div
      onKeyDown={handleKeyDown}
      onBlur={handleBlur}
      className={cn(
        styles.container,
        { [styles.hasBorder]: hasBorder },
        wrapClassName,
      )}
    >
      <div
        className={cn(styles.miniEditor, styles.editorShell, {})}
        onFocus={() => setActive(true)}
      >
        {multiline ? (
          <Input.TextArea
            ref={textAreaRef}
            className={styles.editorField}
            value={value}
            placeholder={placeholder}
            readOnly={readOnly}
            maxLength={nativeMaxLength}
            rows={1}
            onChange={handleChange}
            onPaste={handlePaste}
          />
        ) : (
          <Input
            ref={inputRef}
            bordered={false}
            className={styles.editorField}
            value={value}
            placeholder={placeholder}
            readOnly={readOnly}
            maxLength={nativeMaxLength}
            onChange={handleChange}
            onPaste={handlePaste}
          />
        )}
        {suffix}
      </div>
      {envVisible && (
        <VarMentions
          onSelect={(val: string) =>
            insertText(`${val}}}`, (envObj?.secondLastChar || 0) + 2)
          }
          onCancel={() => setTimeout(() => setEnvVisible(false), 100)}
          envVisible={envVisible}
          offset={envObj?.offset}
          env_id={currentEnvId}
        />
      )}
    </div>
  );
}
