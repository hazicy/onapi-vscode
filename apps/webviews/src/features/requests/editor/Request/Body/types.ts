import type { HttpRequestBody } from "@onapi/domain";
import type { ApiDetailsData } from "@onapi/domain/requests/types/api";
import type { RequestTabsItemProps } from "../types";
export type RequestBodyProps = RequestTabsItemProps & {
  apiData?: ApiDetailsData;
  hideModeSelect?: boolean;
  value: HttpRequestBody | undefined;
  onChange: (key: "body", value: HttpRequestBody | undefined) => void;
};
