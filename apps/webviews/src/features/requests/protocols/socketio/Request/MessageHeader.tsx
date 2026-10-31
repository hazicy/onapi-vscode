import { sendRequestPanelMessage } from "@/shared/bridge/request-panel";
import styles from "./Request.module.css";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";

import { AutoComplete, Checkbox, Flex, Select } from "@/shared/ui/base";

import { useSafeState } from "ahooks";
import { produce } from "immer";
import { filter, includes, isEqual, map, size, trim } from "lodash-es";

import Button from "@/shared/ui/Button";
import useApisWebSocket from "@/features/requests/store/useApis/websocket";
import { SocketIoDetailsData } from "@onapi/domain/requests/types/socketio";

interface Props {
  value: any;
  onChange: (value: any) => void;
  apisData: SocketIoDetailsData;
  onChangeApisData: (apisData: SocketIoDetailsData) => void;
}
const MessageHeader = (props: Props) => {
  const { t } = useTranslation();
  const websocketConnectionPool = useApisWebSocket(
    (state) => state.websocketConnectionPool,
  );
  const { value, onChange, apisData, onChangeApisData } = props || {};
  const apisActiveKey = apisData.id;
  const [binaryType, setBinaryType] = useSafeState("");

  useEffect(() => {
    if (includes(["base64", "hexadecimal"], value?.mode)) {
      setBinaryType("binary");
    } else {
      setBinaryType("");
    }
  }, [setBinaryType, value]);
  const setEventName = (val: string) => {
    const newData = produce(apisData, (draft: any) => {
      draft.msg_data = val;
    });
    onChangeApisData(newData);
  };
  const setAck = (val: boolean) => {
    const newData = produce(apisData, (draft: any) => {
      draft.ack = val ? 1 : -1;
    });
    onChangeApisData(newData);
  };
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
          <Select.Option value="text" className={styles.select}>
            Text
          </Select.Option>
          <Select.Option value="json" className={styles.select}>
            JSON
          </Select.Option>
          <Select.Option value="binary" className={styles.select}>
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
            <Select.Option value="base64" className={styles.select}>
              Base64
            </Select.Option>
            <Select.Option value="hexadecimal" className={styles.select}>
              Hexadecimal
            </Select.Option>
          </Select>
        )}
      </Flex>
      <Flex align="center" gap={12}>
        <Checkbox
          checked={isEqual(apisData?.ack, 1)}
          onChange={(e) => {
            setAck(e?.target?.checked);
          }}
        >
          Ack
        </Checkbox>
        <AutoComplete
          aria-label={t("ws.request.event_name")}
          style={{ width: 160, minWidth: 0, fontSize: 12, height: 28 }}
          value={apisData?.msg_data || ""}
          placeholder={t("ws.request.event_name")}
          onSelect={setEventName}
          maxLength={1024}
          options={filter(
            map(apisData?.request?.event?.parameter, (item) => ({
              value: item?.key,
              label: item?.key,
            })),
            (it) => trim(it?.value) !== "",
          )}
          onChange={setEventName}
          arrowClassName={styles.selectArrow}
          triggerClassName={styles.selectTrigger}
          className={styles.select}
        />
        <Button
          type="primary"
          size="small"
          disabled={
            !(
              size(trim(value?.raw)) > 0 &&
              isEqual(websocketConnectionPool[apisActiveKey]?.status, "connect")
            )
          }
          onClick={() => {
            sendRequestPanelMessage({
              action: "socketio_send",
              data: {
                id: apisActiveKey,
                msg: value?.raw,
                type: value?.mode,
                event: apisData?.msg_data || "message",
                is_ack: apisData?.ack || -1,
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
