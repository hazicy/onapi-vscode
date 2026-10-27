import { AuthField } from "../AuthField";
import "../style.css";
import styles from "../Auth.module.css";
import { Checkbox, Input, Select } from "@/shared/ui/base";

import i18next from "i18next";
import { isEqual, map } from "lodash";

import GhostCollapse from "@/shared/ui/GhostCollapse";
import {
  AUTH_ENUM,
  DIGEST_ALGORITHM_OPTIONS,
} from "@onapi/http-model/requests/constants/auth";

const options = map(DIGEST_ALGORITHM_OPTIONS, (item) => ({
  label: item,
  value: item,
}));

const fieldList = [
  {
    label: "",
    text: i18next.t("common.auth.disable_tip"),
    tip: true,
  },
  {
    name: "disableRetryRequest",
    checked: true,
  },
  { name: "username", placeholder: "Username", label: "Username" },
  { name: "password", placeholder: "Password", label: "Password" },
];

const moreFieldList = [
  { name: "realm", placeholder: "testrealm@example.com", label: "Realm" },
  { name: "nonce", placeholder: "Nonce", label: "Nonce" },
  {
    name: "algorithm",
    placeholder: i18next.t("common.select_tip"),
    type: "select",
    options,
    label: "Algorithm",
  },
  { label: "qop", name: "qop", placeholder: "e.g. auth-int" },
  { name: "nc", placeholder: "e.g. 000000001", label: "Nonce Count" },
  { name: "cnonce", placeholder: "e.g. 0a4f113b", label: "Client Nonce" },
  { name: "opaque", placeholder: "Opaque", label: "Opaque" },
];

const Digest = () => {
  return (
    <>
      {map(fieldList, (item) => {
        return (
          <AuthField
            label={item.label}
            name={[
              AUTH_ENUM.DIGEST,
              (item.name as string) || (item.label as string),
            ]}
            noStyle={item?.tip}
            valuePropName={item.checked ? "checked" : undefined}
          >
            {isEqual(item.tip, true) ? (
              <span className="auth-tips">{item?.text}</span>
            ) : isEqual(item.name, "disableRetryRequest") ? (
              <Checkbox className="auth-checked">
                {i18next.t("common.auth.disable")}
              </Checkbox>
            ) : (
              <Input.TextArea autoSize placeholder={item.placeholder} />
            )}
          </AuthField>
        );
      })}
      <GhostCollapse
        items={[
          {
            key: "digest-more",
            label: (
              <span className={styles.moreTip}>
                {i18next.t("common.auth.more")}
              </span>
            ),
            children: (
              <>
                <span className="auth-tips">
                  {i18next.t("common.auth.more_tip")}
                </span>
                {map(moreFieldList, (item) => {
                  return (
                    <AuthField
                      label={item.label}
                      name={[
                        AUTH_ENUM.DIGEST,
                        (item.name as string) || (item.label as string),
                      ]}
                    >
                      {isEqual(item.type, "select") ? (
                        <Select
                          placeholder={item.placeholder}
                          options={item?.options || []}
                          className={styles.select}
                          triggerClassName={styles.selectTrigger}
                          arrowClassName={styles.selectArrow}
                        />
                      ) : (
                        <Input.TextArea
                          autoSize
                          placeholder={item.placeholder}
                        />
                      )}
                    </AuthField>
                  );
                })}
              </>
            ),
          },
        ]}
      />
    </>
  );
};

export default Digest;
