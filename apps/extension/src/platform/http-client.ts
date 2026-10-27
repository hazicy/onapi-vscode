import * as vscode from "vscode";
import { forEach } from "lodash";
import axios from "axios";

export const proxyFetch = async (data: any, panel: vscode.WebviewPanel) => {
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
    panel.webview.postMessage({
      action: "proxyFetchResult",
      data: { code: 200, data: response.data },
    });
  } catch (error: any) {
    if (error?.response) {
      // Forward errors from target server
      panel.webview.postMessage({
        action: "proxyFetchResult",
        data: { code: error.response.status, error: error.response.data },
      });
    } else {
      panel.webview.postMessage({
        action: "proxyFetchResult",
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
