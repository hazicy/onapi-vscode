import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { sendRequestPanelMessage } from "@/shared/bridge/request-panel";
import { message } from "@/shared/ui/base";
import useProjectConfig from "@/features/project/store/useProjectConfig";
import {
  scopeValues,
  selectActiveEnvironment,
} from "@/features/project/store/useProjectConfig/selectors";
import useUserConfig from "@/features/auth/store/useUserConfig";
import { useStorage } from "@/app/store";
import { useAuth } from "./AuthField";
import { validateOAuth2 } from "./auth-state";
import {
  buildOAuth2TokenRequest,
  buildOAuth2RefreshRequest,
  resolveOAuth2TokenSettings,
  resolveOAuth2RefreshSettings,
  type OAuth2TokenSettings,
} from "./oauth2-token-request";

/** Form validation and dispatch live here; the component owns only presentation. */
export function useOAuth2Token(settings: OAuth2TokenSettings) {
  const { t } = useTranslation();
  const { setErrors } = useAuth();
  const [refreshLoading, setRefreshLoading] = useState(false);
  const globals = useProjectConfig((state) => state.http.options.globals);
  const environment = useProjectConfig(selectActiveEnvironment);
  const variables = useMemo(
    () => ({ ...scopeValues(globals), ...scopeValues(environment) }),
    [globals, environment],
  );
  const uid = useUserConfig((state) => state.userInfo?.uid);
  const refreshToken = useStorage((state) => {
    const token =
      state.oauthRefreshData[uid]?.[settings.clientId ?? ""]?.refresh_token;
    return typeof token === "string" ? token : "";
  });

  const validate = () => {
    const errors = validateOAuth2(settings);
    setErrors(errors);
    return Object.keys(errors).length === 0;
  };
  const reportVariableError = (err: unknown) =>
    message.error(t("common.auth.var_not_defined", { err }));

  const getToken = async () => {
    // Other grants retain their current UI availability and dispatch behavior.
    if (settings.grant_type !== "password_credentials" || !validate()) {
      return;
    }
    let resolved: OAuth2TokenSettings;
    try {
      resolved = await resolveOAuth2TokenSettings(settings, variables);
    } catch (error) {
      reportVariableError(error);
      return;
    }
    try {
      sendRequestPanelMessage({
        action: "/proxy/fetch",
        data: buildOAuth2TokenRequest(resolved),
      });
    } catch {
      message.error(t("common.auth.get_access_fail"));
    }
  };

  const refresh = async () => {
    if (!validate()) {
      return;
    }
    let resolved: OAuth2TokenSettings;
    try {
      resolved = await resolveOAuth2RefreshSettings(settings, variables);
    } catch (error) {
      reportVariableError(error);
      return;
    }
    try {
      setRefreshLoading(true);
      sendRequestPanelMessage({
        action: "/proxy/fetch",
        data: buildOAuth2RefreshRequest(resolved, refreshToken),
      });
    } catch {
      message.error(t("supplement.refresh_fail"));
    } finally {
      setRefreshLoading(false);
    }
  };

  return { getToken, refresh, refreshToken, refreshLoading };
}
