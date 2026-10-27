import { postRequestPanelResponse } from "./webviews/request-panel-channel";
import * as vscode from "vscode";
import { forEach } from "lodash";
import axios from "axios";

export const proxyFetch = async (
  data: any,
  panel: vscode.WebviewPanel,
  requestId?: string,
) => {
  try {
    const paramsData = new URLSearchParams();
    forEach(data?.data, (value, key) => {
      if (value) {
        paramsData.append(key, value as string);
      }
    });
    const config = {
      method: "post",
      ...data,
      headers: {
        ...data.headers,
        Accept: "application/json",
      },
      data: paramsData,
    };
    const response = await axios(config);
    // Return target server response to Webview
    postRequestPanelResponse(panel.webview, {
      action: "proxyFetchResult",
      ...(requestId ? { requestId } : {}),
      data: { code: 200, data: response.data },
    });
  } catch (error: any) {
    if (error?.response) {
      // Forward errors from target server
      postRequestPanelResponse(panel.webview, {
        action: "proxyFetchResult",
        ...(requestId ? { requestId } : {}),
        data: { code: error.response.status, error: error.response.data },
      });
    } else {
      postRequestPanelResponse(panel.webview, {
        action: "proxyFetchResult",
        ...(requestId ? { requestId } : {}),
        data: { code: 500, error: "Internal Proxy Error" },
      });
    }
  }
};

export const responseError = (res: any) => {
  return res?.msg || res?.message || "Service is busy, please try again later.";
};

export const proxyFetch2 = async (data: any) => {
  try {
    const config = {
      method: "post",
      ...data,
      headers: {
        ...data.headers,
        Accept: "application/json",
      },
      data: data?.data || "",
    };
    const response = await axios(config);
    return { code: 200, data: response.data };
  } catch (error: any) {
    if (error?.response) {
      // Forward errors from target server
      return { code: error.response.status, error: responseError(error) };
    } else {
      return { code: 500, error: "Internal Proxy Error" };
    }
  }
};
