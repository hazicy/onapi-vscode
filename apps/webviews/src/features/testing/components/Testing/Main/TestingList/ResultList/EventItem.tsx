import styles from "./ResultList.module.css";
import ResponseSize from "@/features/requests/response/ResponseSize";

import HttpExecDetail from "@/features/requests/response/HttpExecDetail/HttpExecDetail";
import { AppIcon } from "@/shared/ui";
import PrefixIcon from "@/shared/ui/PrefixIcon";
import useTheme from "@/shared/hooks/useTheme";
import { RuntimeResponse } from "@onapi/domain/testing/types/index";
import CustomPopover from "@/shared/ui/Popover";
import { Checkbox, Flex, Tooltip, Typography } from "@/shared/ui/base";
import { Drawer } from "@/shared/ui/Drawer";
import { isArray, isEmpty, toUpper } from "lodash-es";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { isAssertPass } from "@/shared/utils/common";

type EventItemProps = {
  value: {
    request: any;
    response: any;
    console: any;
    assertions: any;
    status: any;
  };
  errorMessage?: string;
  iterationText?: string;
};

const EventItem = (props: EventItemProps) => {
  const { value, iterationText } = props;

  const { t } = useTranslation();
  const { themeToken } = useTheme();
  const { request, response, status } = value;
  const [isOpenHttpExecDetail, setIsOpenHttpExecDetail] = useState(false);
  const [httpExecDetail, setHttpExecDetail] =
    useState<RuntimeResponse | null>();

  const handleViewDetail = (item: RuntimeResponse) => {
    const detail = {
      request: item?.request,
      response: item?.response,
      console: item?.console,
      assertions: item?.assertions,
    };
    setHttpExecDetail(detail);
    setIsOpenHttpExecDetail(true);
  };

  const errorContent = (
    <div style={{ width: 240 }} className={styles.customPopover}>
      {toUpper(status.http) !== "OK" && (
        <Flex vertical gap={8}>
          <Typography.Text className={styles.errorTitle}>
            {t("common.request_error")}
          </Typography.Text>
          <Typography.Text className={styles.errorText}>
            {status.http}
          </Typography.Text>
        </Flex>
      )}

      {isArray(status.assert) && !isEmpty(status.assert) && (
        <Flex style={{ marginTop: 8 }} vertical gap={8}>
          <Typography.Text className={styles.errorTitle}>
            Assertion Error
          </Typography.Text>
          {status.assert.map((i: any) => (
            <Typography.Text className={styles.errorText}>
              {i?.error?.message}
            </Typography.Text>
          ))}
        </Flex>
      )}
    </div>
  );

  return (
    <>
      <Flex
        onClick={() => {
          handleViewDetail(value);
        }}
        justify="space-between"
        className={styles.item}
      >
        <Flex style={{ marginRight: 16 }} gap={16}>
          <Checkbox
            disabled={true}
            checked={true}
            onClick={(e) => {
              e.stopPropagation();
            }}
          />
          <Flex gap={16}>
            <PrefixIcon type="api" method={request.method} />
          </Flex>
        </Flex>

        {request?.url && (
          <Tooltip placement="topLeft" title={request.url}>
            <Typography.Text ellipsis style={{ flex: 1 }}>
              {request.url}
            </Typography.Text>
          </Tooltip>
        )}

        <Flex gap={20} justify="flex-end" flex={1}>
          {toUpper(status.http) !== "OK" || !isAssertPass(status.assert) ? (
            <CustomPopover content={errorContent}>
              <Typography.Text
                onClick={(e) => {
                  e.stopPropagation();
                }}
                ellipsis
                style={{ color: "var(--color-error)", cursor: "pointer" }}
              >
                error
              </Typography.Text>
            </CustomPopover>
          ) : (
            <ResponseSize
              response={response}
              showIcon={false}
              showProxy={true}
            />
          )}
          <Typography.Text style={{ color: themeToken.fontContentColor }}>
            {iterationText}
          </Typography.Text>
          <AppIcon
            icon="external-link"
            onClick={() => handleViewDetail(value)}
          />
        </Flex>
      </Flex>
      <Drawer
        maskClosable
        destroyOnClose
        title={t("supplement.api_detail")}
        width={600}
        open={isOpenHttpExecDetail}
        onClose={() => {
          setIsOpenHttpExecDetail(false);
        }}
      >
        {httpExecDetail && <HttpExecDetail httpExecDetail={httpExecDetail} />}
      </Drawer>
    </>
  );
};

export default EventItem;
