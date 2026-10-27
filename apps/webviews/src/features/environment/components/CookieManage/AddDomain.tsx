import styles from "./AddDomain.module.css";
import { Dispatch } from "react";
import { useTranslation } from "react-i18next";

import { Input, message } from "@/shared/ui/base";

import { snowflakeId } from "@onapi/http-model/utils/data-tools";
import { produce } from "immer";
import { cloneDeep, isArray, isObject, isString } from "lodash-es";

import Button from "@/shared/ui/Button";

import { DomainInfoProps, ICookie } from "./types";

interface Props {
  value: DomainInfoProps;
  onChange: Dispatch<DomainInfoProps>;
  project_id: string | undefined;
}

const Index = (props: Props) => {
  const { t } = useTranslation();
  const { value, onChange, project_id } = props;
  const handleChangeDomain = (
    type: string | string[],
    val: string | { cookieObj: any; inputDomain: string },
  ) => {
    let newVal = value;
    if (isString(type)) {
      newVal = produce(value, (draft) => {
        (draft as any)[type] = val;
      });
    }
    if (isArray(type) && isObject(val)) {
      newVal = produce(value, (draft) => {
        type.forEach((key) => {
          (draft as any)[key] = (val as any)[key];
        });
      });
    }
    onChange(newVal);
  };

  const addDomain = () => {
    let { inputDomain } = value;
    const cookieObj = value.cookieObj;
    const regDomain =
      /^(.+\.)(com|edu|gov|int|mil|net|org|biz|info|name|museum|coop|aero|[a-z][a-z])$/;

    // eslint-disable-next-line no-useless-escape
    const reg = /^[a-z\d|\:|\.|\-|_]*$/;
    if (
      (!regDomain.test(inputDomain) && !reg.test(inputDomain)) ||
      inputDomain?.trim()?.length <= 0
    ) {
      message.error(t("supplement.domain_invalid"));
      return;
    }
    // Need to ignore port number
    inputDomain = inputDomain.replace(/:\d+/, "");
    const newCookieObj = cloneDeep(cookieObj);
    if (Object.keys(newCookieObj).indexOf(inputDomain) > -1) {
      return message.error(t("supplement.domain_has_live"));
    }

    const date = new Date();
    date.setFullYear(date.getFullYear() + 1);
    const newCookie: ICookie = {
      project_id,
      cookie_id: snowflakeId(),
      path: "/",
      key: "newCookie_1",
      value: "value",
      domain: inputDomain,
      expires: date.toUTCString(),
      maxAge: "",
    };
    newCookieObj[inputDomain] = [newCookie];
    handleChangeDomain(["cookieObj", "inputDomain"], {
      cookieObj: newCookieObj,
      inputDomain: "",
    });
  };

  return (
    <div className={styles.container}>
      <Input
        onChange={(e) => handleChangeDomain("inputDomain", e.target.value)}
        className={styles.domin}
        placeholder="example.com"
      />
      <Button onClick={addDomain} type="primary">
        {t("global_setting.cookie_detail.add_domain")}
      </Button>
    </div>
  );
};

export default Index;
