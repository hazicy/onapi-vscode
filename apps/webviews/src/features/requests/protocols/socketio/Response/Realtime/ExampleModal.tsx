import styles from "../../SocketIoDebug.module.css";
import { forwardRef, useImperativeHandle, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { Flex, Select, Space, message } from "@/shared/ui/base";

import { useMemoizedFn } from "ahooks";
import { produce } from "immer";
import { cloneDeep, find, findIndex, isEqual, map } from "lodash-es";

import LineTabs from "@/shared/components/LineTabs/LineTabs";
import RawEditor from "@/shared/components/RawEditor/RawEditor";
import { Input, Modal } from "@/shared/ui";
import { DEFAULT_SOCKETIO_MESSAGE } from "@onapi/domain/requests/constants/default";
import {
  MessageItem,
  SocketIoDetailsData,
} from "@onapi/domain/requests/types/socketio";
import useEditFormat from "@/shared/hooks/useEditFormat";

interface Props {
  onChange?: (v: SocketIoDetailsData) => void;
  rawHtml?: string;
  data: SocketIoDetailsData;
  mode: string;
}

const Index = forwardRef((props: Props, ref) => {
  const { onChange, rawHtml, data, mode } = props;
  const { value: editValue } = useEditFormat(rawHtml || "", mode);
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [binaryType, setBinaryType] = useState("");
  const [isCreate, setIsCreate] = useState(false);
  const [activeKey, setActiveKey] = useState<"request" | "response">(
    "response",
  );
  const [exampleInfo, setExampleInfo] = useState<MessageItem>({
    ...DEFAULT_SOCKETIO_MESSAGE,
  });

  useImperativeHandle(ref, () => {
    return {
      show: ({ key }: any) => {
        setActiveKey("response");
        if (key === "add") {
          setIsCreate(true);
          setExampleInfo({
            ...DEFAULT_SOCKETIO_MESSAGE,
            response: {
              ...DEFAULT_SOCKETIO_MESSAGE.response,
              raw: editValue,
              mode: mode,
            },
          });
        } else {
          setIsCreate(false);
          const item = find(data?.message, (e) => e.param_id === key);

          if (item) {
            setExampleInfo({
              ...item,
              response: {
                ...item.response,
                raw: editValue,
                mode: mode,
              },
            });
          }
        }
        setOpen(true);
      },
    };
  });

  const items = useMemo(() => {
    return map(["request", "response"], (item) => ({
      label: <>{item}</>,
      key: item,
    }));
  }, []);

  const rawEditorValue = useMemo(
    () => ({
      raw: exampleInfo?.[activeKey]?.raw || "",
      raw_schema: exampleInfo?.[activeKey]?.raw_schema,
      raw_parameter: exampleInfo?.[activeKey]?.raw_parameter || [],
    }),
    [activeKey, exampleInfo],
  );

  const handleOnChange = useMemoizedFn(
    (
      key: string,
      newValue: any,
      place: "request" | "response" = "response",
    ) => {
      let _targetItem = cloneDeep(exampleInfo);
      if (isEqual(key, "name")) {
        _targetItem = {
          ..._targetItem,
          [key]: newValue,
        };
      } else if (isEqual(key, "raw-edit")) {
        _targetItem = {
          ..._targetItem,
          [place]: {
            ..._targetItem[place],
            ...newValue,
          },
        };
      } else if (isEqual(key, "schema")) {
        _targetItem = {
          ..._targetItem,
          [place]: {
            ..._targetItem[place],
            ...newValue,
          },
        };
      } else if (isEqual(key, "mode")) {
        _targetItem = {
          ..._targetItem,
          [place]: {
            ..._targetItem[place],
            [key]: newValue,
          },
        };
      }

      setExampleInfo(_targetItem);
    },
  );

  const onOk = () => {
    if (!exampleInfo?.name) {
      message.info(t("api.response_labels.new_modal.name_error_tip"));
      return;
    }
    if (isCreate) {
      const newData = produce(data, (draft) => {
        draft.message.push(exampleInfo);
      });
      if (onChange) {
        onChange(newData);
      }
    } else {
      const newData = produce(data, (draft) => {
        const targetIndex = findIndex(draft?.message, (findItem) =>
          isEqual(findItem.param_id, exampleInfo?.param_id),
        );
        draft.message[targetIndex] = exampleInfo;
      });
      if (onChange) {
        onChange(newData);
      }
    }
    setOpen(false);
  };

  return (
    <Modal
      onOk={onOk}
      destroyOnClose
      width="60vw"
      closeIcon={null}
      onCancel={() => setOpen(false)}
      open={open}
    >
      <div className={styles.exampleModal}>
        <Input
          width={110}
          value={exampleInfo?.name}
          onBlur={(event) =>
            handleOnChange(
              "name",
              event.target.value?.trim() || t("supplement.msg"),
            )
          }
          onChange={(event) => handleOnChange("name", event.target.value)}
          outlinedClassName={styles.inputOutlined}
        />
        <LineTabs
          items={items}
          activeKey={activeKey}
          onChange={(key) => setActiveKey(key as any)}
          navClassName={styles.tabsNav}
          panelsClassName={styles.tabsContent}
          className={styles.tabs}
        />
        <Flex align="center" justify="space-between" className={styles.flex}>
          <Space align="center" className="info-wrap">
            {isEqual(activeKey, "request")
              ? t("supplement.req")
              : t("supplement.res")}
            <Select
              value={binaryType || exampleInfo?.[activeKey]?.mode}
              onChange={(val) => {
                if (val === "binary") {
                  setBinaryType(val);
                  handleOnChange(
                    "mode",
                    isEqual(activeKey, "request") ? "base64" : "binary",
                    activeKey,
                  );
                  return;
                }
                setBinaryType("");
                handleOnChange("mode", val, activeKey);
              }}
              size="small"
              style={{ width: 80 }}
              optionClassName={styles.selectItem}
              popupClassName={styles.selectDropdown}
              triggerClassName={styles.selectTrigger}
              className={styles.select}
            >
              <Select.Option
                value="text"
                optionClassName={styles.selectItem}
                popupClassName={styles.selectDropdown}
                triggerClassName={styles.selectTrigger}
                className={styles.select}
              >
                Text
              </Select.Option>
              <Select.Option
                value="json"
                optionClassName={styles.selectItem}
                popupClassName={styles.selectDropdown}
                triggerClassName={styles.selectTrigger}
                className={styles.select}
              >
                JSON
              </Select.Option>
              <Select.Option
                value="xml"
                optionClassName={styles.selectItem}
                popupClassName={styles.selectDropdown}
                triggerClassName={styles.selectTrigger}
                className={styles.select}
              >
                XML
              </Select.Option>
              <Select.Option
                value="html"
                optionClassName={styles.selectItem}
                popupClassName={styles.selectDropdown}
                triggerClassName={styles.selectTrigger}
                className={styles.select}
              >
                HTML
              </Select.Option>
              <Select.Option
                value="binary"
                optionClassName={styles.selectItem}
                popupClassName={styles.selectDropdown}
                triggerClassName={styles.selectTrigger}
                className={styles.select}
              >
                Binary
              </Select.Option>
            </Select>
            {binaryType === "binary" && isEqual(activeKey, "request") && (
              <Select
                size="small"
                value={exampleInfo?.[activeKey]?.mode}
                onChange={(val) => handleOnChange("mode", val, activeKey)}
                style={{ width: 115 }}
                optionClassName={styles.selectItem}
                popupClassName={styles.selectDropdown}
                triggerClassName={styles.selectTrigger}
                className={styles.select}
              >
                <Select.Option
                  value="base64"
                  optionClassName={styles.selectItem}
                  popupClassName={styles.selectDropdown}
                  triggerClassName={styles.selectTrigger}
                  className={styles.select}
                >
                  Base64
                </Select.Option>
                <Select.Option
                  value="hexadecimal"
                  optionClassName={styles.selectItem}
                  popupClassName={styles.selectDropdown}
                  triggerClassName={styles.selectTrigger}
                  className={styles.select}
                >
                  Hexadecimal
                </Select.Option>
              </Select>
            )}
          </Space>
        </Flex>
        <div className={styles.rawEditorExample}>
          <RawEditor
            mode={exampleInfo?.[activeKey]?.mode}
            value={rawEditorValue}
            onChange={(value, key = "schema") =>
              handleOnChange(key, value, activeKey)
            }
          />
        </div>
      </div>
    </Modal>
  );
});

export default Index;
