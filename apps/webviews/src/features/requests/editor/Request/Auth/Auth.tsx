import { AuthContext } from "./AuthField";
import "./style.css";
import styles from "./Auth.module.css";
import { FC, memo, useState, useMemo } from "react";
import { useTranslation } from "react-i18next";

import { Flex, Field, Select } from "@/shared/ui/base";

import { isEqual } from "lodash-es";

import {
  AUTH_ENUM,
  AUTH_INHERIT_OPTIONS,
  AUTH_OPTIONS,
} from "@onapi/domain/requests/constants/auth";
import type { HttpRequest } from "@onapi/domain";

import { Basic, Bearer, Digest, Jwt, Kv, OAuth1, OAuth2 } from "./components";

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

    const renderContent = (() => {
      const authMap = {
        [AUTH_ENUM.KV]: <Kv />,
        [AUTH_ENUM.BEARER]: <Bearer />,
        [AUTH_ENUM.BASIC]: <Basic />,
        [AUTH_ENUM.JWT]: <Jwt />,
        [AUTH_ENUM.DIGEST]: <Digest />,
        [AUTH_ENUM.OAUTH1]: <OAuth1 />,
        [AUTH_ENUM.OAUTH2]: <OAuth2 />,
        [AUTH_ENUM.NOAUTH]: null,
        [AUTH_ENUM.INHERIT]: null,
      };

      return authMap[value?.type as keyof typeof authMap];
    })();

    const options = useMemo(() => {
      return isSystem
        ? AUTH_OPTIONS
        : [...AUTH_INHERIT_OPTIONS, ...AUTH_OPTIONS];
    }, [isSystem]);

    return (
      <AuthContext.Provider value={{ value, onChange, errors, setErrors }}>
        <div className={styles.container}>
          <Flex className={styles.layout}>
            <div className={styles.form}>
              <Field
                label={t("common.auth.type")}
                labelClassName={styles.formItemLabel}
                className={styles.formItem}
              >
                <Select
                  aria-label={t("common.auth.type")}
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
