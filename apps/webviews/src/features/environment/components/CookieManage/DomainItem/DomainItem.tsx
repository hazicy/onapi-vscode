import styles from "./DomainItem.module.css";
import { Dispatch, useMemo } from "react";

import { produce } from "immer";
import { cloneDeep, keys } from "lodash";

import Collapse from "@/shared/ui/Collapse/Collapse";
import Empty from "@/shared/ui/Empty";
import AppIcon from "@/shared/ui/AppIcon";
import { DomainInfoProps } from "@onapi/http-model/project/types/cookie";

import { ICookie } from "../types";
import CookieTab from "./CookieTab";

interface Props {
  value: DomainInfoProps;
  onChange: Dispatch<DomainInfoProps>;
  project_id: string | undefined;
}

const Index = (props: Props) => {
  const { value, onChange, project_id } = props;

  const handleChangeValue = (type: string, val: any) => {
    const newVal = produce(value, (draft: any) => {
      draft[type] = val;
    });
    onChange(newVal);
  };

  const removerDomain = (domain: string) => {
    const newCookieObj = cloneDeep(value?.cookieObj);
    const cookie_ids: any = [];
    newCookieObj[domain].forEach((item: ICookie) => {
      cookie_ids.push(item.cookie_id);
    });
    if (cookie_ids.length) {
      delete newCookieObj[domain];
      handleChangeValue("cookieObj", newCookieObj);
    }
  };

  const renderLabel = (key: string) => (
    <div className={styles.container}>
      <div className={styles.domin}>{key}</div>
      <span className={styles.titleCookie}>Cookie</span>
      <span className={styles.num}>
        {Object.keys(value?.cookieObj[key]).length}
      </span>
      <AppIcon
        onClick={(e) => {
          e.stopPropagation();
          removerDomain(key);
        }}
        style={{ color: "var(--icon-color)" }}
        icon="trash-2"
        className={styles.icon}
      />
    </div>
  );

  const items = useMemo(() => {
    return Object.keys(value?.cookieObj).map((key) => ({
      key,
      label: renderLabel(key),
      children: <CookieTab domain={key} value={value} onChange={onChange} />,
    }));
  }, [value]);

  return (
    <>
      {keys(value?.cookieObj)?.length ? (
        <Collapse
          defaultActiveKey={Object.keys(value?.cookieObj)[0]}
          items={items}
        />
      ) : (
        <Empty />
      )}
    </>
  );
};

export default Index;
