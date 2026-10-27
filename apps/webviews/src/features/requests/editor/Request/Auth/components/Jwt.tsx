import { AuthField, useAuthValues } from "../AuthField";
import "../style.css";
import styles from "../Auth.module.css";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import { Checkbox, Input, Select } from "@/shared/ui/base";

import { map } from "lodash-es";

import GhostCollapse from "@/shared/ui/GhostCollapse";
import {
  AUTH_ENUM,
  AUTH_INSERT_LOCATION,
  AUTH_INSERT_VALUE,
  JWT_ALGORITHM_OPTIONS,
} from "@onapi/domain/requests/constants/auth";

import CodeEditor from "./CodeEditor";

const Jwt = () => {
  const { t } = useTranslation();
  const { addTokenTo: location } = useAuthValues(AUTH_ENUM.JWT);
  const options = useMemo(() => {
    return map(JWT_ALGORITHM_OPTIONS, (e) => ({
      value: e,
      label: e,
    }));
  }, []);
  return (
    <>
      <AuthField
        label={t("common.auth.add_to")}
        name={[AUTH_ENUM.JWT, "addTokenTo"]}
      >
        <Select
          options={AUTH_INSERT_LOCATION}
          className={styles.select}
          triggerClassName={styles.selectTrigger}
          arrowClassName={styles.selectArrow}
        />
      </AuthField>
      <AuthField label="Algorithm" name={[AUTH_ENUM.JWT, "algorithm"]}>
        <Select
          options={options}
          className={styles.select}
          triggerClassName={styles.selectTrigger}
          arrowClassName={styles.selectArrow}
        />
      </AuthField>
      <AuthField label="Secret" name={[AUTH_ENUM.JWT, "secret"]}>
        <Input.TextArea autoSize />
      </AuthField>
      <AuthField
        valuePropName="checked"
        noStyle
        name={[AUTH_ENUM.JWT, "isSecretBase64Encoded"]}
      >
        <Checkbox className="auth-checked">Secret Base64 encoded</Checkbox>
      </AuthField>
      <AuthField label="Payload" name={[AUTH_ENUM.JWT, "payload"]}>
        <CodeEditor />
      </AuthField>
      <AuthField noStyle>
        <GhostCollapse
          items={[
            {
              key: "jwt-more",
              label: (
                <span className={styles.moreTip}>{t("common.auth.more")}</span>
              ),
              children: (
                <>
                  <span className="auth-tips">{t("common.auth.more_tip")}</span>
                  {location === AUTH_INSERT_VALUE.HEADER ? (
                    <AuthField
                      labelCol={{ span: 6 }}
                      label="Request header prefix"
                      name={[AUTH_ENUM.JWT, "headerPrefix"]}
                    >
                      <Input.TextArea autoSize />
                    </AuthField>
                  ) : (
                    <AuthField
                      labelCol={{ span: 6 }}
                      label="Query param name"
                      name={[AUTH_ENUM.JWT, "queryParamKey"]}
                    >
                      <Input.TextArea autoSize />
                    </AuthField>
                  )}
                  <AuthField
                    label="JWT headers"
                    name={[AUTH_ENUM.JWT, "header"]}
                  >
                    <CodeEditor />
                  </AuthField>
                </>
              ),
            },
          ]}
        />
      </AuthField>
    </>
  );
};

export default Jwt;
