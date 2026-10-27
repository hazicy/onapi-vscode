import { AuthField } from "../AuthField";
import "../style.css";
import styles from "../Auth.module.css";
import { Input, Select } from "@/shared/ui/base";

import i18next from "i18next";
import { isEqual, map } from "lodash";

import GhostCollapse from "@/shared/ui/GhostCollapse";
import {
  AUTH_AWSV4_LOCATION,
  AUTH_ENUM,
} from "@onapi/http-model/requests/constants/auth";

const options = map(AUTH_AWSV4_LOCATION, ({ label, value }) => ({
  label,
  value,
}));

const fieldList = [
  {
    label: i18next.t("common.auth.add_to"),
    name: "addAuthDataToQuery",
    placeholder: i18next.t("common.select_tip"),
    type: "select",
    options,
  },
  { label: "AccessKey", name: "accessKey", placeholder: "Access Key" },
  { label: "SecretKey", name: "secretKey", placeholder: "Secret Key" },
];

const moreFieldList = [
  { label: "AWS Region", name: "region", placeholder: "e.g. us-east-1" },
  { label: "Service Name", name: "service", placeholder: "e.g. s3" },
  {
    label: "Session Token",
    name: "sessionToken",
    placeholder: "Session Token",
  },
];

const Awsv4 = () => {
  return (
    <>
      {map(fieldList, (item) => (
        <AuthField label={item.label} name={[AUTH_ENUM.AWSV4, item.name]}>
          {isEqual(item.type, "select") ? (
            <Select
              placeholder={item.placeholder}
              options={item?.options || []}
              className={styles.select}
              triggerClassName={styles.selectTrigger}
              arrowClassName={styles.selectArrow}
            />
          ) : (
            <Input.TextArea placeholder={item.placeholder} autoSize />
          )}
        </AuthField>
      ))}
      <GhostCollapse
        items={[
          {
            key: "awsv4-more",
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
                {map(moreFieldList, (item) => (
                  <AuthField
                    label={item.label}
                    name={[AUTH_ENUM.AWSV4, item.name]}
                  >
                    <Input.TextArea placeholder={item.placeholder} autoSize />
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

export default Awsv4;
