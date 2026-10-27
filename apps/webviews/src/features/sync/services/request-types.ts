import { AxiosRequestConfig, Method } from "axios";

export type RequestConfig = {
  /** Request URL */
  url: string;
  /** Request body data */
  data?: any;
  /** request timeout */
  timeout?: number;
  /** Request method, default is GET */
  method?: Method;
  /** Request headers */
  headers?: Record<string, any>;
  options?: AxiosRequestConfig & {
    /** Query parameters */
    params?: Record<string, any>;
  };
  /** Override request URL host */
  rewriteHost?: string;
  /** Whether to show request failure error message */
  showFailedErrorMsg?: boolean;
  /** Whether to show request success message */
  showSuccessMsg?: boolean;
  /** Whether to return all response including code and msg, default returns data */
  responseAll?: boolean;
  /** Whether to use cancelToken */
  hasCancelToken?: boolean;
};
