import { AuthField } from "../AuthField";
import "../style.css";
import styles from "../Auth.module.css";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import { Input, Select } from "@/shared/ui/base";

import { map } from "lodash-es";

import GhostCollapse from "@/shared/ui/GhostCollapse";
import {
  AUTH_ENUM,
  JWT_ALGORITHM_OPTIONS,
} from "@onapi/domain/requests/constants/auth";

import CodeEditor from "./CodeEditor";
import PrivateCom from "./PrivateCom";

const Asap = () => {
  const { t } = useTranslation();
  const options = useMemo(() => {
    return map(JWT_ALGORITHM_OPTIONS, (e) => ({
      value: e,
      label: e,
    }));
  }, []);
  return (
    <>
      <AuthField label="Algorithm" name={[AUTH_ENUM.ASAP, "alg"]}>
        <Select
          options={options}
          className={styles.select}
          triggerClassName={styles.selectTrigger}
          arrowClassName={styles.selectArrow}
        />
      </AuthField>
      <AuthField label="issuer" name={[AUTH_ENUM.ASAP, "iss"]}>
        <Input.TextArea autoSize />
      </AuthField>
      <AuthField label="Audience" name={[AUTH_ENUM.ASAP, "aud"]}>
        <Input.TextArea autoSize />
      </AuthField>
      <AuthField label="Key ID" name={[AUTH_ENUM.ASAP, "kid"]}>
        <Input.TextArea autoSize />
      </AuthField>
      <AuthField label="Private Key" name={[AUTH_ENUM.ASAP, "privateKey"]}>
        <PrivateCom />
      </AuthField>
      <GhostCollapse
        items={[
          {
            key: "asap-more",
            label: (
              <span className={styles.moreTip}>{t("common.auth.more")}</span>
            ),
            children: (
              <>
                <AuthField label="Subject" name={[AUTH_ENUM.ASAP, "sub"]}>
                  <Input.TextArea autoSize />
                </AuthField>
                <AuthField
                  label="Additional claims"
                  name={[AUTH_ENUM.ASAP, "claims"]}
                >
                  <CodeEditor />
                </AuthField>
                <AuthField label="Expiry" name={[AUTH_ENUM.ASAP, "exp"]}>
                  <Input.TextArea autoSize />
                </AuthField>
              </>
            ),
          },
        ]}
      />
    </>
  );
};

export default Asap;
