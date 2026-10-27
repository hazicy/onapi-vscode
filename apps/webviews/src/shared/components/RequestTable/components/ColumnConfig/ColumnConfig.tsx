import styles from "./ColumnConfig.module.css";
import classNames from "classnames";
import { FC, memo } from "react";
import { useTranslation } from "react-i18next";

import { Flex, Switch } from "@/shared/ui/base";

import { useSafeState } from "ahooks";
import { produce } from "immer";
import { isEqual } from "lodash";

import { Popover, Tooltip } from "@/shared/ui";
import Button from "@/shared/ui/Button";
import AppIcon from "@/shared/ui/AppIcon";
import { STATUS_CODE } from "@onapi/http-model/constants/common";
import { ChangeFuncType } from "@onapi/http-model/types/common";

import {
  PARAMETER_TYPE,
  RequestTableProps,
  TableColumnSwitchConfig,
} from "../../types";

type Props = Pick<
  RequestTableProps,
  "tabType" | "columnSwitchConfig" | "onColumnSwitchConfig" | "bodyMode"
> & {
  onAiModal: () => void;
  setParameterType: (parameterType: PARAMETER_TYPE) => void;
  setOpen: (open: boolean) => void;
};

const ColumnConfig: FC<Props> = memo(
  ({
    tabType,
    columnSwitchConfig,
    onColumnSwitchConfig,
    setParameterType,
    setOpen,
  }) => {
    const { t } = useTranslation();
    const [popoverOpen, setPopoverOpen] = useSafeState(false);

    const onColumnSwitchChange: ChangeFuncType<TableColumnSwitchConfig> = (
      key,
      value,
    ) => {
      const config = produce(columnSwitchConfig, (draft) => {
        if (draft?.[key]) {
          draft[key] = value;
        }
      });

      config && onColumnSwitchConfig?.(config);
    };

    const calcChecked = (checked: boolean) => {
      return checked ? STATUS_CODE.ENABLE : STATUS_CODE.DISABLE;
    };

    if (isEqual(tabType, "event") || isEqual(tabType, "socketio")) {
      return null;
    }

    const handleOperate = (key: PARAMETER_TYPE) => {
      setParameterType(key);
      setOpen(true);
      setPopoverOpen(false);
    };

    return (
      <div className={styles.columnConfig}>
        <Flex gap={8} align="center" style={{ height: "100%" }}>
          <Popover
            placement="bottomLeft"
            trigger={["click"]}
            arrow={false}
            overlayInnerStyle={{ padding: "8px 12px", width: 228 }}
            open={popoverOpen}
            onOpenChange={(open) => setPopoverOpen(open)}
            content={
              <Flex vertical>
                <Flex
                  align={"center"}
                  justify={"space-between"}
                  className={classNames(styles.container, styles.tipsItemWrap)}
                >
                  <span>{t("common.request_table.display_column")}</span>
                  <Tooltip
                    title={t("common.request_table.display_column_tips")}
                  >
                    <AppIcon icon="info" />
                  </Tooltip>
                </Flex>
                <Flex
                  align={"center"}
                  justify={"space-between"}
                  className={styles.container}
                >
                  <span>
                    {t("common.request_table.display_column_param_type")}
                  </span>
                  <Switch
                    size="small"
                    checked={isEqual(
                      columnSwitchConfig?.parameter_type,
                      STATUS_CODE.ENABLE,
                    )}
                    onChange={(checked) =>
                      onColumnSwitchChange(
                        "parameter_type",
                        calcChecked(checked),
                      )
                    }
                  />
                </Flex>
                <Flex
                  align={"center"}
                  justify={"space-between"}
                  className={styles.container}
                >
                  <span>
                    {t("common.request_table.display_column_param_desc")}
                  </span>
                  <Switch
                    size="small"
                    checked={isEqual(
                      columnSwitchConfig?.parameter_description,
                      STATUS_CODE.ENABLE,
                    )}
                    onChange={(checked) =>
                      onColumnSwitchChange(
                        "parameter_description",
                        calcChecked(checked),
                      )
                    }
                  />
                </Flex>
              </Flex>
            }
          >
            <AppIcon className={styles.iconNaviMore} icon="ellipsis" />
          </Popover>
          <Button
            type="text"
            size="small"
            style={{ justifyContent: "flex-start", paddingInline: 0 }}
            onClick={() => handleOperate(PARAMETER_TYPE.BATCH_EDIT)}
          >
            {t("common.request_table.batch_edit")}
          </Button>
        </Flex>
      </div>
    );
  },
);

export default ColumnConfig;
