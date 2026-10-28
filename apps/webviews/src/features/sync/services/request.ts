import React from "react";

import { message } from "@/shared/ui/base";
import { version } from "@/../package.json";
import axios, { AxiosRequestConfig } from "axios";
import { includes, omit, values } from "lodash-es";
import { stringify } from "qs";

import {
  APIPOST_CLIENT_ID,
  APIPOST_LANGUAGE,
  APIPOST_MACHINE,
  APIPOST_PLATFORM,
  APIPOST_TERMINAL,
  APIPOST_VERSION,
} from "@onapi/domain/auth/constants/user";

import useUiServices from "@/shared/state/ui-services";
import useSystemConfig from "@/features/settings/store/useSystemConfig";
import { useGlobal } from "@/app/store";

import {
  HTTP_METHODS,
  PLAN_TIP_CODES,
  RESPONSE_CODES,
  RESPONSE_ERROR_CODES,
} from "./constants";
import { RequestConfig } from "./request-types";
import { responseError } from "./response-error";

export const requestBaseHeader = {
  [APIPOST_MACHINE]: "",
  [APIPOST_TERMINAL]: "vscode",
  [APIPOST_VERSION]: version || "1.0.0",
  [APIPOST_LANGUAGE]: "en",
  [APIPOST_PLATFORM]: "",
};

const request = ({
  url = "",
  data = {},
  method = HTTP_METHODS.GET,
  options = {},
  headers = {},
  showFailedErrorMsg = true,
  showSuccessMsg = false,
  responseAll = false,
  hasCancelToken = false,
  rewriteHost = "",
}: RequestConfig) => {
  if (!rewriteHost && !/^https?:\/\//i.test(url)) {
    return Promise.reject(
      new Error("Cloud sync is unavailable: no service URL configured."),
    );
  }

  // Create cancel token
  const { token, cancel } = axios.CancelToken.source();
  const { clientId, updateCancelToken } = useGlobal.getState();

  const { modal } = useUiServices.getState();

  // Set cancel token
  !!hasCancelToken && updateCancelToken(cancel);

  const axiosOptions: AxiosRequestConfig = {
    url: rewriteHost ? `${rewriteHost}${url}` : url,
    cancelToken: token,
    method,
    headers: {
      ...requestBaseHeader,
      ...headers,
      ...(clientId ? { [APIPOST_CLIENT_ID]: clientId } : {}),
      [APIPOST_LANGUAGE]:
        useSystemConfig.getState()?.systemConfig?.language || "en",
    },
    withCredentials: false,
    ...options,
  };

  if (method.toLowerCase() === HTTP_METHODS.GET) {
    axiosOptions.url = `${axiosOptions.url}?${stringify(data)}`;
  } else {
    axiosOptions.data = data;
  }

  return axios(axiosOptions)
    .then((res) => {
      if (res && res.status === RESPONSE_CODES.HTTP_SUCCESS) {
        if (res.data.code === RESPONSE_CODES.SUCCESS) {
          if (showSuccessMsg) {
            message.destroy();
            message.success(res.data.msg || "Operation successful");
          }
          return responseAll ? res.data : res.data.data;
        } else {
          return Promise.reject(res.data);
        }
      }
      return Promise.reject(res.data);
    })
    .catch((err) => {
      // Pre-embed force refresh frontend capability for server
      if (err.code === 302) {
        window.location.href = err.msg;
        return Promise.reject("");
      }

      if (
        values(
          omit(RESPONSE_ERROR_CODES, [
            "ERR_CANCELED",
            "DATA_CONFLICTED",
            "GUEST_NEED_LOGIN_SCENE",
          ]),
        ).includes(err.code)
      ) {
        // Prompt logged in from another device
        if (
          includes(
            [
              RESPONSE_ERROR_CODES.LOGIN_OTHER_PLACE,
              RESPONSE_ERROR_CODES.SERVER_CLOSE,
              RESPONSE_ERROR_CODES.NOT_FOUND_USER,
            ],
            err.code,
          )
        ) {
          responseError(err);
        }

        // NOTE: Temporarily hide restore default config
        // useSystemConfig.getState().updateSystemConfig(SYS_CONFIG);

        // NOTE: Whether page refresh is needed
        // window.location.reload();

        return Promise.reject(err);
      }

      if (showFailedErrorMsg && !PLAN_TIP_CODES.PLAN_MODAL.includes(err.code)) {
        responseError(err);
      }
      if (PLAN_TIP_CODES.PLAN_MODAL.includes(err.code) && modal) {
        const { title = "This is a notification message", upgrade_team = -1 } =
          err?.extra_err || {};
        const instance = modal.warning({
          title,
          content: React.createElement("div", null, [
            React.createElement(
              "span",
              null,
              err?.msg ||
                "The current team has reached capacity andcannot accept new members. Please contact the inviter to expand the team",
            ),
            React.createElement("br", null),
            upgrade_team === 1 &&
              React.createElement(
                "a",
                {
                  onClick: () => {
                    instance.destroy();
                  },
                },
                "Upgrade your team",
              ),
          ]),
        });
      }
      return Promise.reject(err);
    });
};

export const get = (config: Omit<RequestConfig, "method">) => {
  return request({ method: "get", ...config });
};

export const post = (config: Omit<RequestConfig, "method">) => {
  return request({ method: "post", ...config });
};

export const put = (config: Omit<RequestConfig, "method">) => {
  return request({ method: "put", ...config });
};

export const del = (config: Omit<RequestConfig, "method">) => {
  return request({ method: "delete", ...config });
};

export default request;
