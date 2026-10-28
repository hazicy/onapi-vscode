import { AuthContext } from "./AuthField";
import "./style.css";
import styles from "./Auth.module.css";
import { FC, memo, useState, useMemo } from "react";
import { useTranslation } from "react-i18next";

import { Flex, Field, Select } from "@/shared/ui/base";

import { concat, isEqual } from "lodash-es";

import {
  AUTH_ENUM,
  AUTH_INHERIT_OPTIONS,
  AUTH_OPTIONS,
} from "@onapi/domain/requests/constants/auth";
import type { HttpRequest } from "@onapi/domain";

import {
  Asap,
  Awsv4,
  Basic,
  Bearer,
  Digest,
  Edgegrid,
  Hawk,
  Jwt,
  Kv,
  Ntlm,
  Oauth1,
  Oauth2,
} from "./components";

import { updateAuthValues } from "./authState";

import { AuthOauth2 } from "@onapi/domain/requests/types/auth";

type Props = {
  isSystem?: boolean;
  value: HttpRequest["auth"];
  onChange: (key: "auth", value: HttpRequest["auth"]) => void;
};

const RequestAuth: FC<Props> = memo(
  (props) => {
    const { value, isSystem, onChange } = props;
    const { t } = useTranslation();
    const [errors, setErrors] = useState<Record<string, string>>({});

    const handleOnChange = (type: string) => {
      onChange(
        "auth",
        type === "inherit"
          ? undefined
          : {
              ...value,
              type: type as NonNullable<HttpRequest["auth"]>["type"],
            },
      );
    };

    const oauth2Change = (oauth2: AuthOauth2) => {
      onChange?.("auth", updateAuthValues(value, "oauth2", oauth2));
    };

    const renderContent = (() => {
      const authMap = {
        [AUTH_ENUM.KV]: <Kv />,
        [AUTH_ENUM.BEARER]: <Bearer />,
        [AUTH_ENUM.BASIC]: <Basic />,
        [AUTH_ENUM.JWT]: <Jwt />,
        [AUTH_ENUM.DIGEST]: <Digest />,
        [AUTH_ENUM.OAUTH1]: <Oauth1 />,
        [AUTH_ENUM.OAUTH2]: <Oauth2 onChange={oauth2Change} />,
        [AUTH_ENUM.HAWK]: <Hawk />,
        [AUTH_ENUM.AWSV4]: <Awsv4 />,
        [AUTH_ENUM.NTLM]: <Ntlm />,
        [AUTH_ENUM.EDGEGRID]: <Edgegrid />,
        [AUTH_ENUM.ASAP]: <Asap />,
        [AUTH_ENUM.NOAUTH]: null,
        [AUTH_ENUM.INHERIT]: null,
      };

      return authMap[value?.type as AUTH_ENUM];
    })();

    const options = useMemo(() => {
      if (isSystem) {
        return AUTH_OPTIONS;
      }
      return concat(AUTH_INHERIT_OPTIONS, AUTH_OPTIONS);
    }, [isSystem]);

    return (
      <AuthContext.Provider value={{ value, onChange, errors, setErrors }}>
        <div className={styles.container}>
          <Flex justify="center" className={styles.layout}>
            <div className={styles.form} style={{ width: 700 }}>
              <Field
                label={t("common.auth.type")}
                labelClassName={styles.formItemLabel}
                className={styles.formItem}
              >
                <Select
                  value={value?.type || "inherit"}
                  options={options}
                  onChange={(type: string) => {
                    setErrors({});
                    handleOnChange(type);
                  }}
                  arrowClassName={styles.selectArrow}
                  className={styles.select}
                  triggerClassName={styles.selectTrigger}
                />
              </Field>
              {renderContent}
            </div>
          </Flex>
        </div>
      </AuthContext.Provider>
    );
  },
  (prevProps, nextProps) => isEqual(prevProps, nextProps),
);

export default RequestAuth;
