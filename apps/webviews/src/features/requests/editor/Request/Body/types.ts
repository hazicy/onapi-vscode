import type { HttpEditorRecord } from "@onapi/domain/requests/record";
import type { HttpRequestBody } from "@onapi/domain";

import type { RequestTabsItemProps } from "../types";
export type RequestBodyProps = RequestTabsItemProps & {
  apiData?: HttpEditorRecord;
  hideModeSelect?: boolean;
  value: HttpRequestBody | undefined;
  onChange: (key: "body", value: HttpRequestBody | undefined) => void;
};
