import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { AuthField, useAuthValues } from "../AuthField";
import { useOAuth2Token } from "../useOAuth2Token";
import "../style.css";
import styles from "../Auth.module.css";
import { Flex, Select, Typography } from "@/shared/ui/base";
import { includes, isEqual } from "lodash-es";
import { SegmentedTabs } from "@/shared/components";
import VarInput from "@/features/variables/components/VarInput/VarInput";
import { Button, AppIcon, Tooltip } from "@/shared/ui";
import GhostCollapse from "@/shared/ui/GhostCollapse";
import {
  AUTH_ENUM,
  AUTH_OAUTH2_AUTHENTICATION,
  AUTH_OAUTH2_CHALLENGE,
  AUTH_OAUTH2_GRANT_TYPE,
  AUTH_OAUTH2_LOCATION,
} from "@onapi/domain/requests/constants/auth";
import OAuth2ParamsTable from "./OAuth2ParamsTable";

const OAuth2 = () => {
  const { t } = useTranslation();
  const oauth2 = useAuthValues(AUTH_ENUM.OAUTH2);
  const { grant_type: grantType, refreshTokenUrl } = oauth2;
  const [selectedTab, setSelectedTab] = useState("authRequestParams");
  const { getToken, refresh, refreshToken, refreshLoading } =
    useOAuth2Token(oauth2);
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
            <OAuth2ParamsTable />
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
            <OAuth2ParamsTable hasSendIn />
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
            <OAuth2ParamsTable hasSendIn />
          </AuthField>
        </Flex>
      ),
    };
    if (isEqual(grantType, "implicit")) {
      return [authRequest, refreshRequest];
    }
    if (["password_credentials", "client_credentials"].includes(grantType)) {
      return [tokenRequest, refreshRequest];
    }
    return [authRequest, tokenRequest, refreshRequest];
  }, [grantType, t]);

  const tabsValue = segmentedOptions.some(
    (option) => option.value === selectedTab,
  )
    ? selectedTab
    : segmentedOptions[0].value;
  useEffect(() => {
    setSelectedTab(tabsValue);
  }, [tabsValue]);

  const unsupportedGrantTip = t("common.auth.unsupported_grant_type");

  const refreshSuffix =
    refreshToken && refreshTokenUrl ? (
      <Tooltip
        title={
          includes(
            ["authorization_code", "authorization_code_with_pkce"],
            grantType,
          )
            ? unsupportedGrantTip
            : ""
        }
      >
        <Button
          loading={refreshLoading}
          onClick={refresh}
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
              ? unsupportedGrantTip
              : ""
          }
        >
          <Button
            onClick={getToken}
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
                  onChange={(val) => setSelectedTab(val as string)}
                />
              </>
            ),
          },
        ]}
      />
    </div>
  );
};

export default OAuth2;
