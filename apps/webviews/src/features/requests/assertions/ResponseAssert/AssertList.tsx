import styles from "./ResponseAssert.module.css";
import classNames from "classnames";
import React from "react";
import { useTranslation } from "react-i18next";

import { Space } from "@/shared/ui/base";

import { isArray } from "lodash";

import { CheckCircleFilled, CloseCircleFilled } from "@/shared/ui/base/Icons";

import { ApiSendingData } from "@onapi/http-model/requests/types/send";

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
                className={classNames(
                  styles.responseAssertItem,
                  styles.contentItem,
                )}
              >
                <Space>
                  {!item.error && !item.skipped ? (
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
