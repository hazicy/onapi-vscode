import styles from "./Body.module.css";
import clsx from "clsx";
import { FC, lazy, useMemo } from "react";

import { Flex, message, Tooltip } from "@/shared/ui/base";

import SuspenseContent from "@/shared/components/SuspenseContent";
import BodyModeSelect from "./BodyModeSelect";
import { REQUEST_BODY_MODE_ENUM } from "@onapi/domain/requests/constants/index";

import { RequestBodyProps } from "./types";

import { Button } from "@/shared/ui";
import { Icon } from "@iconify/react";
import dice5 from "@iconify-icons/lucide/dice-5";

const RequestBodyBinary = lazy(() => import("./components/Binary"));
const RequestBodyFormData = lazy(() => import("./components/FormData"));
const RequestBodyNone = lazy(() => import("./components/None"));
const RequestBodyRaw = lazy(() => import("./components/Raw"));
const RequestBodyUrlencoded = lazy(() => import("./components/Urlencoded"));

const RequestBody: FC<RequestBodyProps> = (props) => {
  const { apiData, value } = props;
  const language = value?.options?.raw?.language || "json";
  const isRawMode = value?.mode === "raw";
  const calcBodyModeValue = isRawMode
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

  const handleGenerateMockBody = () => {
    import("@/features/requests/editor/Request/Body/generate-mock-body")
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
        {!props.hideModeSelect && (
          <Flex className={styles.requestBodyHeader} align="center">
            <BodyModeSelect {...props} />
          </Flex>
        )}
        <div className={styles.requestBodyContentWrap}>
          <SuspenseContent>{bodyContent}</SuspenseContent>
          {apiData?.kind === "api" && isRawMode && language === "json" && (
            <div className={styles.editorActions}>
              <Tooltip title="生成模拟数据">
                <Button
                  aria-label="生成模拟数据"
                  onClick={handleGenerateMockBody}
                  type="text"
                  mode="light"
                  size="small"
                  icon={<Icon icon={dice5} width={16} height={16} />}
                />
              </Tooltip>
            </div>
          )}
        </div>
      </Flex>
    </div>
  );
};

export default RequestBody;
