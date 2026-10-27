import styles from "./index.module.css";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";

import { Flex, Select } from "@/shared/ui/base";

import { useSafeState } from "ahooks";
import { includes, size, trim } from "lodash";

import Button from "@/shared/ui/Button";
import useApis from "@/features/requests/store/useApis";
import useApisWebSocket from "@/features/requests/store/useApis/websocket";
import { WebSocketDetailsData } from "@onapi/http-model/requests/types/websocket";

interface Props {
  value: any;
  onChange: (value: any) => void;
  apisData: WebSocketDetailsData;
}
const MessageHeader = (props: Props) => {
  const { t } = useTranslation();
  const websocketConnectionPool = useApisWebSocket(
    (state) => state.websocketConnectionPool,
  );
  const apisActiveKey = useApis((state) => state.apisActiveData.id);
  const { value, onChange } = props || {};
  const [binaryType, setBinaryType] = useSafeState("");

  useEffect(() => {
    if (includes(["base64", "hexadecimal"], value?.mode)) {
      setBinaryType("binary");
    } else {
      setBinaryType("");
    }
  }, [setBinaryType, value]);
  const connected =
    websocketConnectionPool[apisActiveKey]?.status === "connect";
  const sendHint = !connected
    ? t("ws.request.connect_first")
    : !trim(value?.raw)
      ? t("ws.request.enter_message")
      : "";
  return (
    <div className={styles.messageHeader}>
      <Flex align="center" gap={12}>
        <Select
          value={binaryType || value?.mode}
          onChange={(val) => {
            if (val === "binary") {
              setBinaryType(val);
              onChange({ ...value, mode: "base64" });
              return;
            }
            setBinaryType("");
            onChange({ ...value, mode: val });
          }}
          size="small"
          style={{ width: 80 }}
          arrowClassName={styles.selectArrow}
          triggerClassName={styles.selectTrigger}
          className={styles.select}
        >
          <Select.Option
            value="text"
            arrowClassName={styles.selectArrow}
            triggerClassName={styles.selectTrigger}
            className={styles.select}
          >
            Text
          </Select.Option>
          <Select.Option
            value="json"
            arrowClassName={styles.selectArrow}
            triggerClassName={styles.selectTrigger}
            className={styles.select}
          >
            JSON
          </Select.Option>
          <Select.Option
            value="xml"
            arrowClassName={styles.selectArrow}
            triggerClassName={styles.selectTrigger}
            className={styles.select}
          >
            XML
          </Select.Option>
          <Select.Option
            value="html"
            arrowClassName={styles.selectArrow}
            triggerClassName={styles.selectTrigger}
            className={styles.select}
          >
            HTML
          </Select.Option>
          <Select.Option
            value="binary"
            arrowClassName={styles.selectArrow}
            triggerClassName={styles.selectTrigger}
            className={styles.select}
          >
            Binary
          </Select.Option>
        </Select>
        {binaryType === "binary" && (
          <Select
            size="small"
            value={value?.mode}
            onChange={(val) => onChange({ ...value, mode: val })}
            style={{ width: 115 }}
            arrowClassName={styles.selectArrow}
            triggerClassName={styles.selectTrigger}
            className={styles.select}
          >
            <Select.Option
              value="base64"
              arrowClassName={styles.selectArrow}
              triggerClassName={styles.selectTrigger}
              className={styles.select}
            >
              Base64
            </Select.Option>
            <Select.Option
              value="hexadecimal"
              arrowClassName={styles.selectArrow}
              triggerClassName={styles.selectTrigger}
              className={styles.select}
            >
              Hexadecimal
            </Select.Option>
          </Select>
        )}
      </Flex>
      <Flex align="center" gap={8} className={styles.sendActions}>
        {sendHint && <span className={styles.sendHint}>{sendHint}</span>}
        <Button
          title={sendHint || t("ws.request.sent")}
          type="primary"
          size="small"
          disabled={!(size(trim(value?.raw)) > 0 && connected)}
          onClick={() => {
            window?.vscode.postMessage({
              action: "ws_send",
              data: {
                id: apisActiveKey,
                msg: value?.raw,
                type: value?.mode,
              },
            });
          }}
        >
          {t("ws.request.sent")}
        </Button>
      </Flex>
    </div>
  );
};

export default MessageHeader;
