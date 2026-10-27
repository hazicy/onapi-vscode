import type { ApisBaseDataItem } from "@onapi/domain/requests/types/base";

/** Native SDK parameters edited by the HTTP request panel. */
export interface SdkParameter {
  id?: string;
  key?: string | null;
  value?: string | null;
  disabled?: boolean;
  description?: string | import("postman-collection").DescriptionDefinition;
  type?: string;
  src?: string;
  contentType?: string;
}

export type EditedSdkParameter = Omit<SdkParameter, "key" | "value"> & {
  key: string;
  value?: string | null;
};

export function sdkParameterToRow(
  parameter: SdkParameter,
  id: string,
): ApisBaseDataItem {
  return {
    param_id: parameter.id || id,
    key: parameter.key || "",
    value:
      parameter.type === "file" ? parameter.src || "" : parameter.value || "",
    is_checked: parameter.disabled ? -1 : 1,
    description:
      typeof parameter.description === "string"
        ? parameter.description
        : parameter.description?.content,
    field_type: parameter.type === "file" ? "File" : "String",
    content_type: parameter.contentType,
  };
}

export function rowToSdkParameter(
  row: ApisBaseDataItem,
  original?: SdkParameter,
  formdata = false,
): EditedSdkParameter {
  const parameter: EditedSdkParameter = {
    ...original,
    value: original?.value,
    id: row.param_id,
    key: row.key,
    disabled: row.is_checked === -1,
    description:
      row.description ===
      (typeof original?.description === "string"
        ? original.description
        : original?.description?.content)
        ? original?.description
        : row.description,
    contentType: row.content_type,
  };
  if (formdata) {
    parameter.type = row.field_type === "File" ? "file" : "text";
  }
  if (parameter.type === "file") {
    parameter.src = row.value || "";
    delete parameter.value;
  } else {
    parameter.value =
      original?.value === null && !row.value ? null : row.value || "";
    delete parameter.src;
  }
  return parameter;
}
