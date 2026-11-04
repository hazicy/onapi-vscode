import { AuthField, useAuthValues } from "../AuthField";
import "../style.css";
import styles from "../Auth.module.css";
import { useTranslation } from "react-i18next";

import { Checkbox, Flex, Input, Select } from "@/shared/ui/base";

import { includes, map } from "lodash-es";

import GhostCollapse from "@/shared/ui/GhostCollapse";
import {
  AUTH_ENUM,
  AUTH_OAUTH_LOCATION,
  OAUTH1_METHODS_OPTIONS,
} from "@onapi/domain/requests/constants/auth";

import PrivateCom from "./PrivateCom";

const options = map(OAUTH1_METHODS_OPTIONS, (item) => ({
  label: item,
  value: item,
}));

const Encoding = (props: any) => {
  const { t } = useTranslation();

  return (
    <Checkbox
      checked={!props?.checked}
      onChange={(e) => props?.onChange(!e?.target?.checked)}
    >
      {t("ui.auth_encode_parameters")}
    </Checkbox>
  );
};

const OAuth1 = () => {
  const { t } = useTranslation();
  const { signatureMethod, addParamsToHeader } = useAuthValues(
    AUTH_ENUM.OAUTH1,
  );
  const isRSA = includes(
    ["RSA-SHA1", "RSA-SHA256", "RSA-SHA512"],
    signatureMethod,
  );
  return (
    <>
      <AuthField
        label={t("common.auth.add_to")}
        name={[AUTH_ENUM.OAUTH1, "addParamsToHeader"]}
      >
        <Select
          options={AUTH_OAUTH_LOCATION}
          className={styles.select}
          triggerClassName={styles.selectTrigger}
          arrowClassName={styles.selectArrow}
        />
      </AuthField>
      <AuthField
        label={t("ui.signature_method")}
        name={[AUTH_ENUM.OAUTH1, "signatureMethod"]}
      >
        <Select
          placeholder={t("common.select_tip")}
          options={options}
          className={styles.select}
          triggerClassName={styles.selectTrigger}
          arrowClassName={styles.selectArrow}
        />
      </AuthField>
      <AuthField
        label={t("ui.consumer_key")}
        name={[AUTH_ENUM.OAUTH1, "consumerKey"]}
      >
        <Input.TextArea autoSize />
      </AuthField>
      <>
        <AuthField
          label={t("ui.consumer_secret")}
          name={[AUTH_ENUM.OAUTH1, "consumerSecret"]}
          hidden={isRSA}
        >
          <Input.TextArea autoSize />
        </AuthField>
        <AuthField
          label={t("ui.token_secret")}
          name={[AUTH_ENUM.OAUTH1, "tokenSecret"]}
          hidden={isRSA}
        >
          <Input.TextArea autoSize />
        </AuthField>
        {/* NOTE RSA has two display types */}
        <AuthField
          label={t("ui.access_token")}
          name={[AUTH_ENUM.OAUTH1, "token"]}
          hidden={isRSA}
        >
          <Input.TextArea autoSize />
        </AuthField>
        <AuthField
          label={t("ui.private_key")}
          name={[AUTH_ENUM.OAUTH1, "privateKey"]}
          hidden={!isRSA}
        >
          <PrivateCom />
        </AuthField>
      </>

      <AuthField noStyle>
        <GhostCollapse
          items={[
            {
              key: "oauth1-more",
              label: (
                <span className={styles.moreTip}>{t("common.auth.more")}</span>
              ),
              children: (
                <>
                  <span className="auth-tips">{t("common.auth.more_tip")}</span>
                  <AuthField
                    label={t("ui.callback_url")}
                    name={[AUTH_ENUM.OAUTH1, "callback"]}
                  >
                    <Input.TextArea autoSize />
                  </AuthField>
                  <AuthField
                    label={t("ui.verifier")}
                    name={[AUTH_ENUM.OAUTH1, "verifier"]}
                  >
                    <Input.TextArea autoSize />
                  </AuthField>
                  <AuthField
                    label={t("ui.timestamp")}
                    name={[AUTH_ENUM.OAUTH1, "timestamp"]}
                  >
                    <Input.TextArea autoSize />
                  </AuthField>
                  <AuthField label="Nonce" name={[AUTH_ENUM.OAUTH1, "nonce"]}>
                    <Input.TextArea autoSize />
                  </AuthField>
                  <AuthField
                    label={t("ui.version")}
                    name={[AUTH_ENUM.OAUTH1, "version"]}
                  >
                    <Input.TextArea autoSize />
                  </AuthField>
                  <AuthField label="Realm" name={[AUTH_ENUM.OAUTH1, "realm"]}>
                    <Input.TextArea autoSize />
                  </AuthField>
                  <Flex vertical gap={8}>
                    <AuthField
                      noStyle
                      name={[AUTH_ENUM.OAUTH1, "includeBodyHash"]}
                      valuePropName="checked"
                    >
                      <Checkbox>{t("ui.include_body_hash")}</Checkbox>
                    </AuthField>
                    <AuthField
                      noStyle
                      name={[AUTH_ENUM.OAUTH1, "addEmptyParamsToSign"]}
                      valuePropName="checked"
                    >
                      <Checkbox>{t("ui.auth_sign_empty_parameters")}</Checkbox>
                    </AuthField>
                    {addParamsToHeader && (
                      <AuthField
                        noStyle
                        name={[AUTH_ENUM.OAUTH1, "disableHeaderEncoding"]}
                        valuePropName="checked"
                      >
                        <Encoding />
                      </AuthField>
                    )}
                  </Flex>
                </>
              ),
            },
          ]}
        />
      </AuthField>
    </>
  );
};

export default OAuth1;
