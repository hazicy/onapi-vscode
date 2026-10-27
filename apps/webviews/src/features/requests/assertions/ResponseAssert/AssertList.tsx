import styles from "./ResponseAssert.module.css";
import React from "react";
import { useTranslation } from "react-i18next";

import { Space } from "@/shared/ui/base";

import { isArray } from "lodash-es";

import { CheckCircleFilled, CloseCircleFilled } from "@/shared/ui/base/Icons";

import AppIcon from "@/shared/ui/AppIcon";

export type HttpAssertion = import("@onapi/contracts").ExecutionAssertion;
interface ListProps {
  asserts?: HttpAssertion[];
}
const List: React.FC<ListProps> = ({ asserts }) => {
  const { t } = useTranslation();
  return (
    <>
      {isArray(asserts) && asserts.length > 0 && (
        <>
          <div className={styles.contentTitle}>{t("common.assertion.tag")}</div>
          <div className="assert-list">
            {asserts?.map((item, index) => (
              <span
                key={index}
                data-passed={!item.error && !item.skipped}
                data-skipped={!!item.skipped}
                className={styles.responseAssertItem}
              >
                <Space>
                  {item.skipped ? (
                    <AppIcon icon="minus" />
                  ) : !item.error ? (
                    <CheckCircleFilled />
                  ) : (
                    <CloseCircleFilled />
                  )}
                  <span>
                    {item.error
                      ? `${item.assertion || item.name}: ${item.error.message}`
                      : item.assertion || item.name}
                  </span>
                </Space>
              </span>
            ))}
          </div>
        </>
      )}
    </>
  );
};

export default List;
