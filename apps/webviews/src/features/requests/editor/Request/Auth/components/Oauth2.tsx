import { sendRequestPanelMessage } from "@/shared/bridge/request-panel";
import {
  scopeValues,
  selectActiveEnvironment,
} from "@/features/project/store/useProjectConfig/selectors";
import { validateOAuth2 } from "../authState";
import { AuthField, useAuth, useAuthValues } from "../AuthField";
import "../style.css";
import styles from "../Auth.module.css";
/* eslint-disable no-useless-escape */
import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { Flex, Select, Typography, message } from "@/shared/ui/base";

import { find, has, includes, isEqual, setWith } from "lodash-es";

import { SegmentedTabs } from "@/shared/components";
import VarInput from "@/features/variables/components/VarInput/VarInput";

import { Button, AppIcon, Tooltip } from "@/shared/ui";
import GhostCollapse from "@/shared/ui/GhostCollapse";
import {
  AUTH_ENUM,
  AUTH_OAUTH2_AUTHENTICATION,
  AUTH_OAUTH2_CHALLENGE,
  AUTH_OAUTH2_GRANT_TYPE,
  AUTH_OAUTH2_GRANT_TYPE_MAP,
  AUTH_OAUTH2_LOCATION,
} from "@onapi/domain/requests/constants/auth";
import useApis from "@/features/requests/store/useApis";
import useProjectConfig from "@/features/project/store/useProjectConfig";
import useUserConfig from "@/features/auth/store/useUserConfig";
import { useStorage } from "@/app/store";
import {
  AuthOauth2,
  RequestParamsItem,
} from "@onapi/domain/requests/types/auth";

import {
  resolveOAuth2Parameters,
  resolveOAuth2Variables,
} from "@/features/requests/utils/oauth2Variables";

import Oauth2ParamsTable, { type DataSourceItem } from "./Oauth2ParamsTable";

type ObjectItem = { [key: string]: string };

type AccessInfo = {
  code?: string;
  state?: string;
};

type TokenInfo = Omit<
  AuthOauth2,
  | "access_token"
  | "addTokenTo"
  | "headerPrefix"
  | "challengeAlgorithm"
  | "client_authentication"
  | "refreshTokenUrl"
  | "refreshRequestParams"
>;

interface Props {
  onChange: (v: AuthOauth2) => void;
  id?: string | undefined;
}

const Oauth2 = (props: Props) => {
  const { t } = useTranslation();
  const { setErrors } = useAuth();
  const oauth2 = useAuthValues(AUTH_ENUM.OAUTH2);
  const childWindow = useRef<any>(null);
  const tokenInfo = useRef<Partial<TokenInfo> | null>(null);
  const [tabsValue, setTabsValue] = useState<string>("authRequestParams");
  const [refreshLoading, setRefreshLoading] = useState<boolean>(false);
  const { grant_type: grantType, clientId, refreshTokenUrl } = oauth2;
  const globals = useProjectConfig((state) => state.http.options.globals);
  const environment = useProjectConfig(selectActiveEnvironment);
  const apisActiveKey = useApis((state) => state.apisActiveData.id);
  const uid = useUserConfig((state) => state?.userInfo?.uid);
  const getOauthRefreshData = useStorage((state) => state.getOauthRefreshData);

  const closeChildWindow = () => {
    try {
      childWindow?.current?.close();
    } catch (e) {}
  };

  const getAccessToken = async ({ code, state }: AccessInfo) => {
    const {
      tokenRequestParams = [],
      accessTokenUrl = "",
      clientId,
      clientSecret,
      redirect_uri,
      grant_type,
      code_verifier,
      password,
      username,
    } = tokenInfo.current || {};
    const { data, params, headers } = tokenRequestParams.reduce(
      (pre, { key, value, send_as }) => {
        const { data, params, headers } = pre;
        if (isEqual(send_as, "request_body")) {
          data[key] = value;
        } else if (isEqual(send_as, "request_url")) {
          params[key] = value;
        } else {
          headers[key] = value;
        }
        return pre;
      },
      {
        data: {} as ObjectItem,
        params: {} as ObjectItem,
        headers: {} as ObjectItem,
      },
    );
    const prams = {
      ...data,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri,
      grant_type:
        grant_type && has(AUTH_OAUTH2_GRANT_TYPE_MAP, grant_type)
          ? AUTH_OAUTH2_GRANT_TYPE_MAP[grant_type]
          : undefined,
    };
    if (code) {
      setWith(prams, ["code"], code, Object);
    }
    if (state) {
      setWith(prams, ["state"], state, Object);
    }
    if (isEqual(grant_type, "authorization_code_with_pkce")) {
      setWith(prams, ["code_verifier"], code_verifier, Object);
    }
    if (isEqual(grant_type, "password_credentials")) {
      setWith(prams, ["password"], password, Object);
      setWith(prams, ["username"], username, Object);
    }

    try {
      sendRequestPanelMessage({
        action: "/proxy/fetch",
        data: {
          url: accessTokenUrl,
          data: prams,
          headers: {
            ...headers,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          options: { params },
        },
      });

      closeChildWindow();
    } catch (err: any) {
      message.error(t("common.auth.get_access_fail"));
      closeChildWindow();
    }
  };

  const handleMessage = (e: any) => {
    const isEqualOrigin = e?.origin === location.origin;
    if (e?.data?.source === "oauth-source-subpage" && isEqualOrigin) {
      const watching = isEqual(props.id, apisActiveKey);
      if (e?.data?.payload?.code && watching) {
        getAccessToken({
          code: e?.data?.payload?.code,
          state: e?.data?.payload?.state,
        });
      }
    }
  };

  const refreshToken = useMemo(() => {
    return getOauthRefreshData([uid, clientId, "refresh_token"]);
  }, [uid, clientId]);

  useEffect(() => {
    window.addEventListener("message", handleMessage);
    return () => {
      closeChildWindow();
      window.removeEventListener("message", handleMessage);
    };
  }, [apisActiveKey]);

  const segmentedOptions = useMemo(() => {
    const authRequest = {
      label: "Auth Request",
      key: "authRequestParams",
      value: "authRequestParams",
      children: (
        <Flex vertical gap={4}>
          <Typography.Text
            style={{ color: "var(--font-light-color)", marginBottom: 20 }}
          >
            {t("common.auth.auth_table_tip")}
          </Typography.Text>
          <AuthField noStyle name={[AUTH_ENUM.OAUTH2, "authRequestParams"]}>
            <Oauth2ParamsTable />
          </AuthField>
        </Flex>
      ),
    };
    const tokenRequest = {
      label: "Token Request",
      key: "tokenRequestParams",
      value: "tokenRequestParams",
      children: (
        <Flex vertical gap={4}>
          <Typography.Text
            style={{ color: "var(--font-light-color)", marginBottom: 12 }}
          >
            {t("common.auth.token_table_tip")}
          </Typography.Text>
          <AuthField noStyle name={[AUTH_ENUM.OAUTH2, "tokenRequestParams"]}>
            <Oauth2ParamsTable hasSendIn />
          </AuthField>
        </Flex>
      ),
    };
    const refreshRequest = {
      label: "Refresh Request",
      key: "refreshRequestParams",
      value: "refreshRequestParams",
      children: (
        <Flex vertical gap={4}>
          <Typography.Text
            style={{ color: "var(--font-light-color)", marginBottom: 12 }}
          >
            {t("common.auth.refresh_table_tip")}
          </Typography.Text>
          <AuthField noStyle name={[AUTH_ENUM.OAUTH2, "refreshRequestParams"]}>
            <Oauth2ParamsTable hasSendIn />
          </AuthField>
        </Flex>
      ),
    };
    if (isEqual(grantType, "implicit")) {
      if (isEqual(tabsValue, "tokenRequestParams")) {
        setTabsValue("authRequestParams");
      }
      return [authRequest, refreshRequest];
    }
    if (["password_credentials", "client_credentials"].includes(grantType)) {
      if (isEqual(tabsValue, "authRequestParams")) {
        setTabsValue("tokenRequestParams");
      }
      return [tokenRequest, refreshRequest];
    }
    return [authRequest, tokenRequest, refreshRequest];
  }, [grantType]);

  const variableMap = useMemo(() => {
    return { ...scopeValues(globals), ...scopeValues(environment) };
  }, [globals, environment]);

  const validateUrl = (value = "") =>
    resolveOAuth2Variables(value, variableMap);
  const validateTableParams = (parameters: DataSourceItem[]) =>
    resolveOAuth2Parameters(parameters, variableMap);

  const handleGetTokenByPassword = async () => {
    const errors = validateOAuth2(oauth2);
    setErrors(errors);
    if (Object.keys(errors).length) {
      return;
    }
    const {
      clientId,
      scope,
      state,
      accessTokenUrl,
      clientSecret,
      tokenRequestParams,
      grant_type,
      password,
      username,
    } = oauth2 || {};
    try {
      const [
        _clientId,
        _scope,
        _state,
        _accessTokenUrl,
        _clientSecret,
        _password,
        _username,
        _tokenRequestParams,
      ] = await Promise.all([
        await validateUrl(clientId),
        await validateUrl(scope),
        await validateUrl(state),
        await validateUrl(accessTokenUrl),
        await validateUrl(clientSecret),
        await validateUrl(password),
        await validateUrl(username),
        await validateTableParams(tokenRequestParams || []),
      ]);
      tokenInfo.current = {
        clientId: _clientId,
        scope: _scope,
        state: _state,
        accessTokenUrl: _accessTokenUrl,
        clientSecret: _clientSecret,
        password: _password,
        username: _username,
        tokenRequestParams:
          _tokenRequestParams as unknown as RequestParamsItem[],
        grant_type,
      };
      await getAccessToken({});
    } catch (err) {
      return message.error(t("common.auth.var_not_defined", { err }));
    }
  };

  const handleGetToken = () => {
    if (isEqual(grantType, "password_credentials")) {
      handleGetTokenByPassword();
    }
  };

  const refreshAccessToken = async ({
    clientId,
    clientSecret,
    redirect_uri,
    refreshTokenUrl,
    refreshRequestParams,
  }: Pick<
    AuthOauth2,
    | "refreshRequestParams"
    | "clientId"
    | "clientSecret"
    | "redirect_uri"
    | "refreshTokenUrl"
  >) => {
    const { data, params, headers } = refreshRequestParams.reduce(
      (pre, { key, value, send_as }) => {
        const { data, params, headers } = pre;
        if (isEqual(send_as, "request_body")) {
          data[key] = value;
        } else if (isEqual(send_as, "request_url")) {
          params[key] = value;
        } else {
          headers[key] = value;
        }
        return pre;
      },
      {
        data: {} as ObjectItem,
        params: {} as ObjectItem,
        headers: {} as ObjectItem,
      },
    );
    const prams: any = {
      ...data,
      refresh_token: refreshToken,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri,
    };

    try {
      setRefreshLoading(true);
      sendRequestPanelMessage({
        action: "/proxy/fetch",
        data: {
          url: refreshTokenUrl,
          data: prams,
          headers: {
            ...headers,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          options: { params },
        },
      });
    } catch (err: any) {
      message.error(t("supplement.refresh_fail"));
    } finally {
      setRefreshLoading(false);
    }
  };

  const handleRefreshToken = async () => {
    const errors = validateOAuth2(oauth2);
    setErrors(errors);
    if (Object.keys(errors).length) {
      return;
    }
    const {
      clientId,
      redirect_uri,
      clientSecret,
      refreshRequestParams,
      refreshTokenUrl,
    } = oauth2 || {};
    try {
      const [
        _clientId,
        _redirect_uri,
        _clientSecret,
        _refreshTokenUrl,
        _refreshRequestParams,
      ] = await Promise.all([
        await validateUrl(clientId),
        await validateUrl(redirect_uri),
        await validateUrl(clientSecret),
        await validateUrl(refreshTokenUrl),
        await validateTableParams(refreshRequestParams || []),
      ]);
      await refreshAccessToken({
        clientId: _clientId,
        redirect_uri: _redirect_uri,
        clientSecret: _clientSecret,
        refreshTokenUrl: _refreshTokenUrl,
        refreshRequestParams:
          _refreshRequestParams as unknown as RequestParamsItem[],
      });
    } catch (err) {
      return message.error(t("common.auth.var_not_defined", { err }));
    }
  };

  const downLoadTip = t("common.auth.unsupported_grant_type");

  const refreshSuffix =
    refreshToken && refreshTokenUrl ? (
      <Tooltip
        title={
          includes(
            ["authorization_code", "authorization_code_with_pkce"],
            grantType,
          )
            ? downLoadTip
            : ""
        }
      >
        <Button
          loading={refreshLoading}
          onClick={handleRefreshToken}
          disabled={includes(
            ["authorization_code", "authorization_code_with_pkce"],
            grantType,
          )}
          size="mini"
          type="primary"
          mode="light"
          icon={<AppIcon icon="refresh-cw" />}
        >
          {t("base.refresh")}
        </Button>
      </Tooltip>
    ) : undefined;

  return (
    <div className={styles.oauth2}>
      <AuthField
        label={t("common.auth.add_to")}
        name={[AUTH_ENUM.OAUTH2, "addTokenTo"]}
      >
        <Select
          options={AUTH_OAUTH2_LOCATION || []}
          className={styles.select}
          triggerClassName={styles.selectTrigger}
          arrowClassName={styles.selectArrow}
        />
      </AuthField>
      <AuthField
        tooltip={t("common.auth.header_prefix")}
        label={"Header Prefix"}
        name={[AUTH_ENUM.OAUTH2, "headerPrefix"]}
      >
        <VarInput hasBorder />
      </AuthField>
      <AuthField
        name={[AUTH_ENUM.OAUTH2, "access_token"]}
        tooltip={t("common.auth.access_token_tip")}
        label={"Token"}
      >
        <VarInput suffix={refreshSuffix} hasBorder />
      </AuthField>
      <div className={styles.divider}></div>
      <Flex style={{ marginBottom: 20 }} justify="space-between" align="center">
        <span style={{ color: "var(--font-title-color)" }}>
          {t("common.auth.get_token")}
        </span>
        <Tooltip
          title={
            includes(
              ["authorization_code", "authorization_code_with_pkce"],
              grantType,
            )
              ? downLoadTip
              : ""
          }
        >
          <Button
            onClick={handleGetToken}
            size="small"
            disabled={includes(
              ["authorization_code", "authorization_code_with_pkce"],
              grantType,
            )}
            type="primary"
          >
            {t("common.auth.get_token")}
          </Button>
        </Tooltip>
      </Flex>
      <AuthField label={"Grant type"} name={[AUTH_ENUM.OAUTH2, "grant_type"]}>
        <Select
          options={AUTH_OAUTH2_GRANT_TYPE || []}
          className={styles.select}
          triggerClassName={styles.selectTrigger}
          arrowClassName={styles.selectArrow}
        />
      </AuthField>
      <AuthField
        hidden={["client_credentials", "password_credentials"].includes(
          grantType,
        )}
        tooltip={t("common.auth.call_url_tip")}
        label={"Callback URL"}
        name={[AUTH_ENUM.OAUTH2, "redirect_uri"]}
      >
        <VarInput hasBorder />
      </AuthField>
      <AuthField
        hidden={["client_credentials", "password_credentials"].includes(
          grantType,
        )}
        tooltip={t("common.auth.auth_url_tip")}
        label={"Auth URL"}
        name={[AUTH_ENUM.OAUTH2, "authUrl"]}
      >
        <VarInput hasBorder />
      </AuthField>

      <AuthField
        hidden={isEqual(grantType, "implicit")}
        tooltip={t("common.auth.access_url_tip")}
        label={"Access Token URL"}
        name={[AUTH_ENUM.OAUTH2, "accessTokenUrl"]}
      >
        <VarInput hasBorder />
      </AuthField>
      <AuthField
        tooltip={t("common.auth.client_id_tip")}
        label={"Client ID"}
        name={[AUTH_ENUM.OAUTH2, "clientId"]}
      >
        <VarInput hasBorder />
      </AuthField>
      <AuthField
        hidden={isEqual(grantType, "implicit")}
        tooltip={t("common.auth.client_secret_tip")}
        label={"Client Secret"}
        name={[AUTH_ENUM.OAUTH2, "clientSecret"]}
      >
        <VarInput hasBorder />
      </AuthField>
      <AuthField
        hidden={!isEqual(grantType, "password_credentials")}
        label={"Username"}
        name={[AUTH_ENUM.OAUTH2, "username"]}
      >
        <VarInput hasBorder />
      </AuthField>
      <AuthField
        hidden={!isEqual(grantType, "password_credentials")}
        label={"Password"}
        name={[AUTH_ENUM.OAUTH2, "password"]}
      >
        <VarInput hasBorder />
      </AuthField>
      <AuthField
        hidden={!isEqual(grantType, "authorization_code_with_pkce")}
        tooltip={t("common.auth.code_method_tip")}
        label={"Code Challenge Method"}
        name={[AUTH_ENUM.OAUTH2, "challengeAlgorithm"]}
      >
        <Select
          options={AUTH_OAUTH2_CHALLENGE || []}
          className={styles.select}
          triggerClassName={styles.selectTrigger}
          arrowClassName={styles.selectArrow}
        />
      </AuthField>
      <AuthField
        hidden={!isEqual(grantType, "authorization_code_with_pkce")}
        tooltip={t("common.auth.code_verify_tip")}
        label={"Code Verifier"}
        name={[AUTH_ENUM.OAUTH2, "code_verifier"]}
      >
        <VarInput maxLength={128} hasBorder />
      </AuthField>
      <AuthField
        tooltip={t("common.auth.scope_tip")}
        label={"Scope"}
        name={[AUTH_ENUM.OAUTH2, "scope"]}
      >
        <VarInput hasBorder />
      </AuthField>
      <AuthField
        hidden={["password_credentials", "client_credentials"].includes(
          grantType,
        )}
        tooltip={t("common.auth.state_tip")}
        label={"State"}
        name={[AUTH_ENUM.OAUTH2, "state"]}
      >
        <VarInput hasBorder />
      </AuthField>
      <AuthField
        tooltip={t("common.auth.client_auth_tip")}
        label={"Client Authentication"}
        name={[AUTH_ENUM.OAUTH2, "client_authentication"]}
      >
        <Select
          options={AUTH_OAUTH2_AUTHENTICATION || []}
          className={styles.select}
          triggerClassName={styles.selectTrigger}
          arrowClassName={styles.selectArrow}
        />
      </AuthField>
      <GhostCollapse
        style={{ marginTop: 24 }}
        items={[
          {
            key: "oauth2-more",
            label: (
              <span className={styles.moreTip}>{t("common.auth.more")}</span>
            ),
            children: (
              <>
                <AuthField
                  tooltip={t("common.auth.refresh_token_tip")}
                  label={"Refresh Token URL"}
                  name={[AUTH_ENUM.OAUTH2, "refreshTokenUrl"]}
                >
                  <VarInput hasBorder />
                </AuthField>
                <SegmentedTabs
                  wrapClassName="oauth-segment"
                  options={segmentedOptions}
                  value={tabsValue}
                  onChange={(val) => setTabsValue(val as string)}
                />
              </>
            ),
          },
        ]}
      />
    </div>
  );
};

export default Oauth2;
