import styles from "../../RequestTable.module.css";
import { FC, memo } from "react";
import { useTranslation } from "react-i18next";

import { Checkbox, CheckboxProps, Flex } from "@/shared/ui/base";

import cn from "classnames";
import { isEqual, isNumber } from "lodash-es";

import AppIcon from "@/shared/ui/AppIcon";
import Tooltip from "@/shared/ui/Tooltip";

import { RequestTableProps } from "../../types";

type Props = Pick<
  RequestTableProps,
  "tabType" | "queryAddEqual" | "onChangeQueryAddEqual"
> & {
  allCheckboxStatus: {
    checked: boolean;
    indeterminate: boolean;
  };
  handleCheckAll: CheckboxProps["onChange"];
};

const RowKeyTitle: FC<Props> = memo(
  ({
    queryAddEqual,
    tabType,
    allCheckboxStatus,
    handleCheckAll,
    onChangeQueryAddEqual,
  }) => {
    const { t } = useTranslation();
    return (
      <Flex
        justify="space-between"
        align="center"
        style={{ marginLeft: "-8px" }}
      >
        <Flex align="center" gap={8}>
          {!isEqual(tabType, "socketio") && (
            <Checkbox {...allCheckboxStatus} onChange={handleCheckAll} />
          )}
          <span className="txt-title">
            {t("common.request_table.param_name")}
          </span>
        </Flex>
        {isEqual(tabType, "query") && isNumber(queryAddEqual) && (
          <span className="sameIcon">
            <Tooltip
              title={
                <div>
                  {isEqual(queryAddEqual, -1)
                    ? t("common.request_table.dont_add_euqal")
                    : t("common.request_table.add_euqal")}
                </div>
              }
            >
              <span
                className={cn(
                  styles.queryEqIconWrap,
                  isEqual(queryAddEqual, 1) ? styles.active : "",
                )}
              >
                <AppIcon
                  icon="equal"
                  onClick={() => {
                    onChangeQueryAddEqual?.(
                      isEqual(queryAddEqual, -1) ? 1 : -1,
                    );
                  }}
                  className={styles.icon}
                />
              </span>
            </Tooltip>
          </span>
        )}
      </Flex>
    );
  },
);

export default RowKeyTitle;
