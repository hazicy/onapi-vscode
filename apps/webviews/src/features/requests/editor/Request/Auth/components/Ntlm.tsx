import { AuthField } from "../AuthField";
import "../style.css";
import styles from "../Auth.module.css";
import { useTranslation } from "react-i18next";

import { Checkbox, Input } from "@/shared/ui/base";

import { map } from "lodash-es";

import GhostCollapse from "@/shared/ui/GhostCollapse";
import { AUTH_ENUM } from "@onapi/domain/requests/constants/auth";

const fieldList = [
  { label: "Username", name: "username", placeholder: "Username" },
  { label: "Password", name: "password", placeholder: "password" },
];

const moreFieldList = [
  { label: "Domain", name: "domain", placeholder: "e.g. example.com" },
  { label: "Workstation", name: "workstation", placeholder: "e.g. someone-PC" },
];

const Ntlm = () => {
  const { t } = useTranslation();
  return (
    <>
      <span className="auth-tips">{t("common.auth.disable_tip")}</span>
      <AuthField
        label=""
        valuePropName="checked"
        name={[AUTH_ENUM.NTLM, "disableRetryRequest"]}
      >
        <Checkbox className="auth-checked">{t("common.auth.disable")}</Checkbox>
      </AuthField>
      {map(fieldList, (item) => (
        <AuthField label={item.label} name={[AUTH_ENUM.NTLM, item.name]}>
          <Input.TextArea autoSize placeholder={item.placeholder} />
        </AuthField>
      ))}
      <GhostCollapse
        items={[
          {
            key: "hawk-more",
            label: (
              <span className={styles.moreTip}>{t("common.auth.more")}</span>
            ),
            children: (
              <>
                <span className="auth-tips">{t("common.auth.more_tip")}</span>
                {map(moreFieldList, (item) => (
                  <AuthField
                    label={item.label}
                    name={[AUTH_ENUM.NTLM, item.name]}
                  >
                    <Input.TextArea autoSize placeholder={item.placeholder} />
                  </AuthField>
                ))}
              </>
            ),
          },
        ]}
      />
    </>
  );
};

export default Ntlm;
