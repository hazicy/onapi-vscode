import { AuthField } from "../AuthField";
import "../style.css";
import styles from "../Auth.module.css";
import { useTranslation } from "react-i18next";

import { Checkbox, Input, Select } from "@/shared/ui/base";

import { isEqual, map } from "lodash";

import GhostCollapse from "@/shared/ui/GhostCollapse";
import {
  AUTH_ENUM,
  HAWK_ALGOTITH_OPTIONS,
} from "@onapi/http-model/requests/constants/auth";

const options = map(HAWK_ALGOTITH_OPTIONS, (item) => ({
  label: item,
  value: item,
}));

const fieldList = [
  { label: "Hawk Auth ID", name: "authId", placeholder: "Auth Id" },
  { label: "Hawk Auth Key", name: "authKey", placeholder: "Auth Key" },
  {
    label: "Algorithm",
    name: "algorithm",
    placeholder: "",
    type: "select",
    options,
  },
];

const moreFieldList = [
  { label: "User", name: "user", placeholder: "Username" },
  { label: "Nonce", name: "nonce", placeholder: "Nonce" },
  { label: "ext", name: "extraData", placeholder: "e.g. some-app-extra-data" },
  { label: "app", name: "app", placeholder: "Application ID" },
  { label: "dlg", name: "delegation", placeholder: "e.g. delegated-by" },
  { label: "Timestamp", name: "timestamp", placeholder: "TimeStamp" },
];

const Hawk = () => {
  const { t } = useTranslation();
  return (
    <>
      {map(fieldList, (item) => (
        <AuthField label={item.label} name={[AUTH_ENUM.HAWK, item.name]}>
          {isEqual(item.type, "select") ? (
            <Select
              placeholder={item.placeholder}
              options={item?.options || []}
              className={styles.select}
              triggerClassName={styles.selectTrigger}
              arrowClassName={styles.selectArrow}
            />
          ) : (
            <Input.TextArea autoSize placeholder={item.placeholder} />
          )}
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
                    name={[AUTH_ENUM.HAWK, item.name]}
                  >
                    <Input.TextArea autoSize placeholder={item.placeholder} />
                  </AuthField>
                ))}
                <AuthField
                  valuePropName="checked"
                  noStyle
                  name={[AUTH_ENUM.HAWK, "includePayloadHash"]}
                >
                  <Checkbox className="auth-checked">
                    include payload hash
                  </Checkbox>
                </AuthField>
              </>
            ),
          },
        ]}
      />
    </>
  );
};

export default Hawk;
