import styles from "./FlowResponse.module.css";
import React from "react";

import { Flex } from "@/shared/ui/base";

import classNames from "classnames";
import { includes, isEqual } from "lodash-es";

import AppIcon from "@/shared/ui/AppIcon";
import Tooltip from "@/shared/ui/Tooltip";
import { sizeFormat } from "@/shared/utils/common";

import WsIcon from "./Icon";
import { RowItemTipsConfig } from "./types";

interface Props {
  data: any;
  renderTitle?: (data: any) => React.ReactNode;
  customTipsContent?: (data: any) => RowItemTipsConfig;
}

const RowItem = (props: Props) => {
  const { data, renderTitle, customTipsContent } = props || {};

  const calcTipsContent = (data: any) => {
    let config: RowItemTipsConfig = {
      size: data?.size,
      time: data?.time,
      mode: data?.mode,
    };

    if (customTipsContent) {
      config = customTipsContent?.(data);
    }

    return (
      <>
        <p>size: {sizeFormat(config?.size)}</p>
        <p>time: {config?.time}</p>
        {config?.mode && <p>Mime Type: {config?.mode}</p>}
      </>
    );
  };

  return (
    <Flex justify="space-between" style={{ width: "100%" }}>
      <Flex
        gap={12}
        align="center"
        style={{ maxWidth: "80%", overflow: "hidden" }}
      >
        <span
          className={classNames({
            [styles.iconSpan]: true,
            [styles.message]: isEqual("message", data.action),
            [styles.send]: isEqual("send", data.action),
          })}
        >
          <WsIcon action={data.action} />
        </span>
        {renderTitle?.(data)}
      </Flex>

      <Flex gap={12} justify="flex-end">
        {includes(["message", "send"], data.action) && (
          <>
            <Tooltip title={calcTipsContent(data)}>
              <AppIcon
                className={classNames(styles.flowIcon, styles.icon)}
                icon="info"
              />
            </Tooltip>
          </>
        )}
        <span>{data?.time}</span>
      </Flex>
    </Flex>
  );
};

export default RowItem;
