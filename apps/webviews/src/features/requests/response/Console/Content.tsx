import styles from "./Content.module.css";
import classNames from "classnames";
import ReactJson from "@microlink/react-json-view";

import { Flex } from "@/shared/ui/base";

import { isJson } from "@onapi/http-model/utils/data-tools";
import {
  includes,
  isArray,
  isEqual,
  isNumber,
  isPlainObject,
  map,
} from "lodash-es";

import AppIcon from "@/shared/ui/AppIcon";
import useSystemConfig from "@/features/settings/store/useSystemConfig";
import { ApiSendResponseDataConsoleItem } from "@onapi/http-model/requests/types/send";

import { ConsoleContentProps } from "./types";

import { formatTime, TIME_FORMAT } from "@onapi/http-model/utils/time";

const CONSOLE_LEVEL_ICON_MAP: Partial<{ [x in keyof Console]: string }> = {
  error: "circle-alert",
  warn: "triangle-alert",
} as const;

const ConsoleContent = (props: ConsoleContentProps) => {
  const { consoleList } = props;
  const { bg_color } = useSystemConfig((state) => state?.systemConfig);

  const computedContent = (
    argsItem: any,
    level: ApiSendResponseDataConsoleItem["level"],
  ) => {
    if (isEqual(level, "error") && isPlainObject(argsItem)) {
      return String(argsItem?.errorMessage);
    }

    if (isPlainObject(argsItem) || isJson(argsItem) || isArray(argsItem)) {
      try {
        const result = isJson(argsItem) ? JSON.parse(argsItem) : argsItem;

        return (
          <ReactJson
            src={result}
            theme={
              ["white", "orange"].includes(bg_color)
                ? "rjv-default"
                : "eighties"
            }
            style={{ backgroundColor: "transparent", fontFamily: "inherit" }}
            indentWidth={2}
            name={false}
            collapsed
            displayObjectSize={false}
            displayDataTypes={false}
            enableClipboard={false}
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            displayArrayKey={false}
          />
        );
      } catch {
        return String(argsItem);
      }
    }

    return String(argsItem);
  };

  return (
    <div className={styles.container}>
      {map(consoleList, (consoleItem, consoleIndex) => (
        <Flex
          align={"center"}
          key={`${consoleItem.level}-${consoleIndex}`}
          className={classNames(
            styles.consoleItem,
            styles[consoleItem.level] ?? consoleItem.level,
          )}
        >
          <div className={styles.time}>
            {isNumber(consoleItem.time)
              ? formatTime(consoleItem.time, TIME_FORMAT.TIME_L)
              : consoleItem.time}
          </div>
          {includes(["warn", "error"], consoleItem.level) && (
            <AppIcon
              icon={CONSOLE_LEVEL_ICON_MAP[consoleItem.level] || ""}
              className={styles.icon}
            />
          )}
          <Flex>
            {map(
              "messages" in consoleItem && Array.isArray(consoleItem.messages)
                ? consoleItem.messages
                : consoleItem.args,
              (argsItem, argsIndex) => {
                return (
                  <div className={styles.consoleItemContent} key={argsIndex}>
                    {computedContent(argsItem, consoleItem.level)}
                  </div>
                );
              },
            )}
          </Flex>
        </Flex>
      ))}
    </div>
  );
};

export default ConsoleContent;
