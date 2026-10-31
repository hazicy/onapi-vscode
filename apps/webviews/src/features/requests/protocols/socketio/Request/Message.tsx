import styles from "./Request.module.css";
import clsx from "clsx";
import { useMemo } from "react";

import { useMemoizedFn } from "ahooks";
import { snowflakeId } from "@onapi/domain/utils/data-tools";
import { produce } from "immer";
import {
  cloneDeep,
  concat,
  find,
  findIndex,
  head,
  isEqual,
  map,
  set,
} from "lodash-es";

import { RawEditor } from "@/shared/components";

import context from "@/shared/components/RawEditor/visualizationContext";
import {
  MessageItem,
  SocketIoDetailsData,
} from "@onapi/domain/requests/types/socketio";

import MessageHeader from "./MessageHeader";
import { DEFAULT_WEBSOCKET_MESSAGE } from "@onapi/domain/requests/constants/request";
import { MessagePresets } from "../../shared/SocketPanels";

interface Props {
  value: SocketIoDetailsData;
  onChange: (data: SocketIoDetailsData) => void;
}
const Message = (props: Props) => {
  const { Provider } = context;
  const { value, onChange } = props || {};

  const handleMessage = (data: MessageItem[]) => {
    onChange({
      ...value,
      message: data,
    });
  };
  const handleAdd = () => {
    const param_id = snowflakeId();
    const newMessage = concat(value.message, {
      ...DEFAULT_WEBSOCKET_MESSAGE,
      param_id,
    });
    onChange({ ...value, message: newMessage, active_id: param_id });
  };
  const handleSelect = (param_id: string) => {
    onChange({
      ...value,
      active_id: param_id,
    });
  };
  const handleRemove = useMemoizedFn((param_id: string) => {
    let active_id;
    const activeKey = value?.active_id || head(value.message)?.param_id;
    const newMessage = produce(value.message, (draft) => {
      const messageIndex = findIndex(value.message, (item) =>
        isEqual(item.param_id, param_id),
      );
      if (messageIndex > -1) {
        draft.splice(messageIndex, 1);
      }
      if (isEqual(activeKey, param_id)) {
        const nextActiveKey =
          draft[messageIndex - 1]?.param_id || head(draft)?.param_id;
        active_id = nextActiveKey;
      } else {
        active_id = value?.active_id;
      }
    });

    onChange({
      ...value,
      message: newMessage,
      active_id: active_id,
    });
  });
  const onEdit = (
    index: number,
    { value: item }: { key: string; value: string },
  ) => {
    const message = cloneDeep(value?.message);

    set(message, index, {
      ...message[index],
      name: item,
    });
    handleMessage(message);
  };

  const onChangeItemRequest = (
    data: Pick<
      MessageItem["request"],
      "mode" | "raw" | "raw_parameter" | "raw_schema"
    >,
  ) => {
    const newMessage = map(value.message, (item) => {
      if (
        isEqual(item.param_id, value.active_id || head(value.message)?.param_id)
      ) {
        return { ...item, request: { ...data } };
      }
      return item;
    });

    handleMessage(newMessage);
  };
  const curItem = useMemo(() => {
    return (
      find(value.message, (item) => isEqual(item.param_id, value.active_id)) ||
      head(value.message)
    );
  }, [value.message, value.active_id]);

  return (
    <div className={styles.composer}>
      <MessagePresets
        key={value.id}
        items={value.message || []}
        activeId={curItem?.param_id}
        onSelect={handleSelect}
        onRename={onEdit}
        onAdd={handleAdd}
        onRemove={handleRemove}
      />
      <Provider
        value={{
          isDebugArea: true,
        }}
      >
        {curItem && (
          <div className={styles.messageBody}>
            <MessageHeader
              value={curItem.request}
              onChangeApisData={onChange}
              apisData={value}
              onChange={onChangeItemRequest}
            />
            <div className={clsx(styles.rawEditor, "raw-editor-wrap")}>
              <RawEditor
                regularValueHeight={0}
                mode={curItem.request.mode}
                value={curItem.request}
                onChange={onChangeItemRequest}
              />
            </div>
          </div>
        )}
      </Provider>
    </div>
  );
};

export default Message;
