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
} from "@onapi/http-model/requests/constants/auth";

import PrivateCom from "./PrivateCom";

const options = map(OAUTH1_METHODS_OPTIONS, (item) => ({
  label: item,
  value: item,
}));

const Encoding = (props: any) => {
  return (
    <Checkbox
      checked={!props?.checked}
      onChange={(e) => props?.onChange(!e?.target?.checked)}
    >
      Encode the parameters in the Authorization header
    </Checkbox>
  );
};

const Oauth1 = () => {
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
        label="Signature Method"
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
      <AuthField label="Consumer Key" name={[AUTH_ENUM.OAUTH1, "consumerKey"]}>
        <Input.TextArea autoSize />
      </AuthField>
      <>
        <AuthField
          label="Consumer Secret"
          name={[AUTH_ENUM.OAUTH1, "consumerSecret"]}
          hidden={isRSA}
        >
          <Input.TextArea autoSize />
        </AuthField>
        <AuthField
          label="Token Secret"
          name={[AUTH_ENUM.OAUTH1, "tokenSecret"]}
          hidden={isRSA}
        >
          <Input.TextArea autoSize />
        </AuthField>
        {/* NOTE RSA has two display types */}
        <AuthField
          label="Access Token"
          name={[AUTH_ENUM.OAUTH1, "token"]}
          hidden={isRSA}
        >
          <Input.TextArea autoSize />
        </AuthField>
        <AuthField
          label="Private Key"
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
                    label="Callback Url"
                    name={[AUTH_ENUM.OAUTH1, "callback"]}
                  >
                    <Input.TextArea autoSize />
                  </AuthField>
                  <AuthField
                    label="Verifier"
                    name={[AUTH_ENUM.OAUTH1, "verifier"]}
                  >
                    <Input.TextArea autoSize />
                  </AuthField>
                  <AuthField
                    label="Timestamp"
                    name={[AUTH_ENUM.OAUTH1, "timestamp"]}
                  >
                    <Input.TextArea autoSize />
                  </AuthField>
                  <AuthField label="Nonce" name={[AUTH_ENUM.OAUTH1, "nonce"]}>
                    <Input.TextArea autoSize />
                  </AuthField>
                  <AuthField
                    label="Version"
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
                      <Checkbox>Include body hash</Checkbox>
                    </AuthField>
                    <AuthField
                      noStyle
                      name={[AUTH_ENUM.OAUTH1, "addEmptyParamsToSign"]}
                      valuePropName="checked"
                    >
                      <Checkbox>Add empty parameters to signature</Checkbox>
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

export default Oauth1;
