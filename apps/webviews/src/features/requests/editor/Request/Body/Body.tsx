import styles from "./Body.module.css";
import clsx from "clsx";
import { FC, lazy, useMemo } from "react";

import { Flex, message, Tooltip } from "@/shared/ui/base";

import SuspenseContent from "@/shared/components/SuspenseContent";
import BodyModeSelect from "./BodyModeSelect";
import {
  REQUEST_BODY_MODE_ENUM,
  REQUEST_RAW_MODE_LIST,
} from "@onapi/domain/requests/constants/index";

import { RequestBodyProps } from "./types";

import { Button, AppIcon } from "@/shared/ui";

const RequestBodyBinary = lazy(() => import("./components/Binary"));
const RequestBodyFormData = lazy(() => import("./components/FormData"));
const RequestBodyNone = lazy(() => import("./components/None"));
const RequestBodyRaw = lazy(() => import("./components/Raw"));
const RequestBodyUrlencoded = lazy(() => import("./components/Urlencoded"));

const RequestBody: FC<RequestBodyProps> = (props) => {
  const { apiData, value } = props;
  const language = value?.options?.raw?.language || "json";
  const isRowMode = value?.mode === "raw";
  const calcBodyModeValue = isRowMode
    ? REQUEST_BODY_MODE_ENUM.RAW
    : value?.mode === "formdata"
      ? REQUEST_BODY_MODE_ENUM.FORM_DATA
      : value?.mode === "file"
        ? REQUEST_BODY_MODE_ENUM.BINARY
        : value?.mode === "urlencoded"
          ? REQUEST_BODY_MODE_ENUM.URLENCODED
          : REQUEST_BODY_MODE_ENUM.NONE;

  const bodyContent = useMemo(() => {
    const bodyMap = {
      [REQUEST_BODY_MODE_ENUM.NONE]: <RequestBodyNone />,
      [REQUEST_BODY_MODE_ENUM.FORM_DATA]: <RequestBodyFormData {...props} />,
      [REQUEST_BODY_MODE_ENUM.URLENCODED]: <RequestBodyUrlencoded {...props} />,
      [REQUEST_BODY_MODE_ENUM.BINARY]: <RequestBodyBinary {...props} />,
      [REQUEST_BODY_MODE_ENUM.RAW]: (
        <RequestBodyRaw {...props} mode={language} />
      ),
    };

    return bodyMap[calcBodyModeValue];
  }, [calcBodyModeValue, props, language]);

  const handleGenerateParameterByAi = () => {
    import("@/features/requests/utils/generateMockBody")
      .then(({ generateMockBody }) => generateMockBody(value?.raw))
      .then((mockData: unknown) => {
        if (typeof mockData !== "string" || !mockData) {
          return;
        }
        props.onChange("body", { ...props.value, mode: "raw", raw: mockData });
      })
      .catch((error: unknown) =>
        message.error(error instanceof Error ? error.message : String(error)),
      );
  };

  return (
    <div className={clsx(styles.container, "request-body-container")}>
      <Flex vertical className={styles.flex}>
        {(!props.hideModeSelect ||
          (apiData?.kind === "api" && isRowMode && language === "json")) && (
          <Flex
            className={clsx(styles.requestBodyHeader, styles.flex)}
            align="center"
            justify="space-between"
          >
            <Flex align="center" className={styles.flex}>
              {!props.hideModeSelect && <BodyModeSelect {...props} />}
            </Flex>
            {apiData?.kind === "api" && (
              <Flex
                className={clsx(styles.otherBtn, styles.flex)}
                align="center"
              >
                {language === "json" && (
                  <Tooltip title="Auto Generate">
                    <Flex className={styles.flex}>
                      <Button
                        onClick={handleGenerateParameterByAi}
                        type="text"
                        mode="light"
                        size="small"
                        icon={
                          <AppIcon
                            style={{
                              color: "var(--icon-color)",
                              fontSize: "16px",
                            }}
                            icon="sparkles"
                          />
                        }
                        className={styles.button}
                      ></Button>
                    </Flex>
                  </Tooltip>
                )}
              </Flex>
            )}
          </Flex>
        )}
        <SuspenseContent>
          <div className={styles.requestBodyContentWrap}>{bodyContent}</div>
        </SuspenseContent>
      </Flex>
    </div>
  );
};

export default RequestBody;
