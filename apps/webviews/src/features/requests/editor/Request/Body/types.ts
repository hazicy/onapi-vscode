import type { HttpRequestBody } from "@onapi/http-model";
import type { ApiDetailsData } from "@onapi/http-model/requests/types/api";
import type { RequestTabsItemProps } from "../types";
export type RequestBodyProps = RequestTabsItemProps & {
  apiData?: ApiDetailsData;
  hideModeSelect?: boolean;
  value: HttpRequestBody | undefined;
  onChange: (key: "body", value: HttpRequestBody | undefined) => void;
};
