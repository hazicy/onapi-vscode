import useProjectConfig from "@/features/project/store/useProjectConfig";
import useUserConfig from "@/features/auth/store/useUserConfig";
import { useStorage } from "@/app/store";
import {
  readAuthValues,
  updateAuthValues,
} from "@/features/requests/editor/Request/Auth/authState";
import { message } from "@/shared/ui/base";
import { cloneDeep, isPlainObject, isString, setWith } from "lodash-es";
import { useTranslation } from "react-i18next";

const useEnv = () => {
  const { t } = useTranslation();

  const handleSetToken = (data: any) => {
    const state = useProjectConfig.getState();
    const http = state.http;
    const auth = http?.collection.auth;
    const { oauthRefreshData, updateOauthRefreshData } = useStorage.getState();
    const { uid } = useUserConfig.getState().userInfo;
    if (data?.access_token) {
      message.success(t("common.auth.get_access_success"));

      if (http) {
        const nextAuth = updateAuthValues(auth, "oauth2", {
          access_token: isString(data.access_token)
            ? data.access_token
            : JSON.stringify(data.access_token),
        });
        state.updateProjectConfig({
          http: { ...http, collection: { ...http.collection, auth: nextAuth } },
        });
      }
    } else {
      message.error(t("common.auth.get_access_fail"));
    }
    if (data?.refresh_token) {
      const newOauthRefreshData = cloneDeep(oauthRefreshData);
      setWith(
        newOauthRefreshData,
        [uid, readAuthValues(auth, "oauth2").clientId || ""],
        data,
        Object,
      );
      updateOauthRefreshData(newOauthRefreshData);
    }
  };

  const handleProxyFetchResult = (event: {
    code: number;
    data: any;
    error: string;
  }) => {
    const { code, data, error } = event;
    if (code !== 200 || !isPlainObject(data)) {
      message.error(t("common.auth.get_access_fail"));
      return;
    }
    handleSetToken(data);
  };

  return {
    handleProxyFetchResult,
  };
};

export default useEnv;
