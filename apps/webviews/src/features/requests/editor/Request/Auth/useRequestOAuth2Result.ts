import { useTranslation } from "react-i18next";
import { cloneDeep, isPlainObject, setWith } from "lodash-es";
import { message } from "@/shared/ui/base";
import useRequestWorkspaceStore from "@/features/requests/store/useRequestWorkspaceStore";
import useUserConfig from "@/features/auth/store/useUserConfig";
import { useStorage } from "@/app/store";
import { readAuthValues, updateAuthValues } from "./auth-state";

function isTokenData(value: unknown): value is Record<string, unknown> {
  return isPlainObject(value);
}

/** Request-panel results update the current draft through the native auth attribute list. */
export function useRequestOAuth2Result() {
  const { t } = useTranslation();
  const handleProxyFetchResult = (result: {
    code: number;
    data?: unknown;
    error?: unknown;
  }) => {
    const { activeRequest, setActiveRequest } =
      useRequestWorkspaceStore.getState();
    if (
      activeRequest.kind === "ai" ||
      activeRequest.kind === "mcp" ||
      activeRequest.kind === "grpc" ||
      activeRequest.kind === "folder"
    ) {
      return;
    }
    if (result.code !== 200 || !isTokenData(result.data)) {
      message.error(t("common.auth.get_access_fail"));
      return;
    }
    const data = result.data;
    const auth = activeRequest.request.auth;
    if (data.access_token) {
      const accessToken =
        typeof data.access_token === "string"
          ? data.access_token
          : JSON.stringify(data.access_token);
      setActiveRequest({
        ...activeRequest,
        request: {
          ...activeRequest.request,
          auth: updateAuthValues(auth, "oauth2", { access_token: accessToken }),
        },
      });
      message.success(t("common.auth.get_access_success"));
    } else {
      message.error(t("common.auth.get_access_fail"));
    }
    if (data.refresh_token) {
      const { oauthRefreshData, updateOauthRefreshData } =
        useStorage.getState();
      const uid = useUserConfig.getState().userInfo.uid;
      const clientId = String(readAuthValues(auth, "oauth2").clientId ?? "");
      const next = cloneDeep(oauthRefreshData);
      setWith(next, [uid, clientId], data, Object);
      updateOauthRefreshData(next);
    }
  };
  return { handleProxyFetchResult };
}
