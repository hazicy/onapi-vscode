import { Select } from "@/shared/ui/base";
import { Icon } from "@iconify/react";
import chevronDown from "@iconify-icons/lucide/chevron-down";
import { REQUEST_RAW_MODE_LIST } from "@onapi/domain/requests/constants/index";
import type { RequestBodyContentType } from "@onapi/domain/requests/types/request";
import { type RequestBodyProps } from "./types";
import styles from "./BodyModeSelect.module.css";

const groups = [
  {
    label: "Form Data",
    options: [
      { value: "urlencoded", label: "Url Encoded" },
      { value: "form-data", label: "Multi-Part" },
    ],
  },
  {
    label: "Text Content",
    options: [
      { value: "json", label: "JSON" },
      { value: "xml", label: "XML" },
      { value: "javascript", label: "JavaScript" },
      { value: "html", label: "HTML" },
      { value: "plain", label: "Other" },
    ],
  },
  {
    label: "Other",
    options: [
      { value: "binary", label: "Binary File" },
      { value: "none", label: "No Body" },
    ],
  },
];
const modes = groups.flatMap((group) =>
  group.options.map((option) => option.value),
) as RequestBodyContentType[];

export function getBodyMode(props: RequestBodyProps): RequestBodyContentType {
  switch (props.value?.mode) {
    case "raw":
      return (props.value.options?.raw?.language ||
        "json") as RequestBodyContentType;
    case "formdata":
      return "form-data";
    case "urlencoded":
      return "urlencoded";
    case "file":
      return "binary";
    default:
      return "none";
  }
}

export function getBodyModeLabel(props: RequestBodyProps): string {
  const mode = getBodyMode(props);
  return mode === "none"
    ? "Body"
    : groups
        .flatMap((group) => group.options)
        .find((option) => option.value === mode)?.label || "Body";
}

export function changeBodyMode(
  props: RequestBodyProps,
  mode: RequestBodyContentType,
) {
  if (mode === "none") {
    props.onChange("body", undefined);
    return;
  }
  const raw = REQUEST_RAW_MODE_LIST.some((value) => value === mode);
  props.onChange("body", {
    ...props.value,
    mode: raw
      ? "raw"
      : mode === "form-data"
        ? "formdata"
        : mode === "binary"
          ? "file"
          : "urlencoded",
    ...(raw
      ? {
          options: {
            ...props.value?.options,
            raw: { ...props.value?.options?.raw, language: mode },
          },
          raw: props.value?.raw || "",
        }
      : {}),
  });
}

export default function BodyModeSelect(
  props: RequestBodyProps & { iconOnly?: boolean },
) {
  return (
    <Select
      aria-label="Body type"
      size="small"
      variant="borderless"
      value={getBodyMode(props)}
      options={groups}
      labelRender={({ value, label }) => (value === "none" ? "Body" : label)}
      valueClassName={props.iconOnly ? styles.hiddenLabel : undefined}
      suffixIcon={<Icon icon={chevronDown} width={14} height={14} />}
      arrowClassName={styles.arrow}
      popupArrow
      placement="bottomLeft"
      popupClassName={styles.menu}
      listClassName={styles.menuList}
      optionClassName={styles.option}
      indicatorClassName={styles.check}
      groupLabelClassName={styles.groupLabel}
      onChange={(value) => {
        const mode = modes.find((mode) => mode === value);
        if (mode) {
          changeBodyMode(props, mode);
        }
      }}
      className={[styles.select, props.iconOnly && styles.iconOnly]
        .filter(Boolean)
        .join(" ")}
      triggerClassName={styles.trigger}
    />
  );
}
