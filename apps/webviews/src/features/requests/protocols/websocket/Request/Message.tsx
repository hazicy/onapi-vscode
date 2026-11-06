import styles from "./Request.module.css";
import clsx from "clsx";
import { snowflakeId } from "@onapi/domain/utils/data-tools";

import { RawEditor } from "@/shared/components";

import context from "@/shared/components/RawEditor/requestEditorContext";
import {
  MessageItem,
  WebSocketDetailsData,
} from "@onapi/domain/requests/types/websocket";

import MessageHeader from "./MessageHeader";
import { DEFAULT_WEBSOCKET_MESSAGE } from "@onapi/domain/requests/constants/request";

interface Props {
  value: WebSocketDetailsData;
  onChange: (data: WebSocketDetailsData) => void;
}
const Message = (props: Props) => {
  const { Provider } = context;
  const { value, onChange } = props || {};

  const curItem = value.message?.[0];
  const request = curItem?.request || DEFAULT_WEBSOCKET_MESSAGE.request;

  const onChangeItemRequest = (data: MessageItem["request"]) => {
    const item = curItem || {
      ...structuredClone(DEFAULT_WEBSOCKET_MESSAGE),
      param_id: snowflakeId(),
    };
    const updated = { ...item, request: { ...data } };
    onChange({
      ...value,
      message: [updated],
    });
  };

  return (
    <div className={styles.composer}>
      <Provider
        value={{
          isDebugArea: true,
        }}
      >
        <div className={styles.messageBody}>
          <MessageHeader
            value={request}
            apisData={value}
            onChange={onChangeItemRequest}
          />
          <div className={clsx(styles.rawEditor, "raw-editor-wrap")}>
            <RawEditor
              regularValueHeight={0}
              mode={request.mode}
              value={request}
              onChange={onChangeItemRequest}
            />
          </div>
        </div>
      </Provider>
    </div>
  );
};

export default Message;
