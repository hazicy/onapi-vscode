import { head, isPlainObject } from "lodash";
import { fromCurlPostmanRequest } from "@onapi/domain/curl/utils/postman-request";
import * as vscode from "vscode";
import curlToPostman from "curl-to-postmanv2";
import { APIS_TARGET_TYPE_ENUM } from "@onapi/domain/requests/constants/index";
import { DEFAULT_APIS_BASE_DATA } from "@onapi/domain/requests/constants/default";
import { getHistoryOpensData } from "@onapi/domain/request-utils";

export const curlImport = (parsedValue: string) => {
  return new Promise((resolve, reject) => {
    try {
      curlToPostman.convert(
        { type: "string", data: parsedValue },
        (error: any, result: any) => {
          if (result?.error && !result?.result) {
            reject(result?.error?.message);
            return;
          }
          if (error) {
            reject(error);
            return;
          }

          const newApi = fromCurlPostmanRequest(
            head<any>(result?.output)?.data,
          );

          if (!newApi) {
            reject(new Error("Unable to convert cURL request"));
            return;
          }

          newApi.project_id = "";
          newApi.name = DEFAULT_APIS_BASE_DATA?.name || "HTTP Request";
          if (
            isPlainObject(newApi) &&
            newApi?.kind === APIS_TARGET_TYPE_ENUM.API
          ) {
            // Open new tab
            const newApiData: any = getHistoryOpensData(newApi);
            vscode.commands.executeCommand("openTabPanel", newApiData);
            resolve(null);
          }
        },
      );
    } catch (error) {
      reject(error);
    }
  });
};
