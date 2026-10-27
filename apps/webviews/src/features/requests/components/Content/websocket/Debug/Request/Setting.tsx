import styles from "./index.module.css";
import { useTranslation } from "react-i18next";

import { Flex, InputNumber, Switch } from "@/shared/ui/base";

import { useMemoizedFn } from "ahooks";
import { produce } from "immer";
import { isEqual, map } from "lodash";

interface Props {
  value: any;
  onChange: (data: any) => void;
  readOnly?: boolean;
}
const Setting = (props: Props) => {
  const { t } = useTranslation();
  const { value, readOnly, onChange } = props || {};

  const handleConfig = useMemoizedFn((key: string, val: any) => {
    const newData = produce(value, (draft: any) => {
      draft[key] = val;
    });

    onChange(newData);
  });

  const SETTING_MAP_LIST = [
    {
      key: "certificate_verification",
      title: t("ws.settings.certificate_verification"),
      desc: t("ws.settings.certificate_verification_tip"),
      children: (
        <Switch
          disabled={readOnly}
          checked={isEqual(value?.certificate_verification, 1)}
          onChange={(val) =>
            handleConfig("certificate_verification", val ? 1 : -1)
          }
        />
      ),
    },
    {
      key: "shake_hands_timeout",
      title: t("ws.settings.time_out"),
      desc: t("ws.settings.time_out_tip"),
      children: (
        <InputNumber
          readOnly={readOnly}
          controls={false}
          addonAfter="ms"
          value={value?.shake_hands_timeout}
          onChange={(val) => handleConfig("shake_hands_timeout", val)}
          className={styles.inputNumber}
        />
      ),
    },
    {
      key: "information_size",
      title: t("ws.settings.content"),
      desc: t("ws.settings.content_tip"),
      children: (
        <InputNumber
          readOnly={readOnly}
          controls={false}
          value={value?.information_size}
          onChange={(val) => handleConfig("information_size", val)}
          className={styles.inputNumber}
        />
      ),
    },
  ];
  return (
    <div className={styles.container}>
      <Flex style={{ marginLeft: 8 }} vertical gap={12}>
        {map(SETTING_MAP_LIST, (it) => (
          <>
            {
              <Flex key={it.key} gap={12} align="center">
                <Flex flex={1} vertical>
                  <div className="setting-title">{it.title}</div>
                  <div className={styles.settingDesc}>{it.desc}</div>
                </Flex>
                <Flex
                  flex={0.1}
                  style={{ minWidth: 120 }}
                  align="start"
                  justify="start"
                >
                  {it.children}
                </Flex>
              </Flex>
            }
          </>
        ))}
      </Flex>
    </div>
  );
};

export default Setting;
