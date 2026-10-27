import styles from "../VarInsertPop.module.css";
import { useMemo } from "react";

import { Flex } from "@/shared/ui/base";

import classNames from "classnames";

import AiDescIcon from "@/shared/assets/icon/aidesc.png";
import { AppIcon } from "@/shared/ui";
import {
  DESC_OPTIONS_LIST,
  VARIABLE_TABS_VALUE,
  VAR_OPTIONS_KEY,
  VAR_OPTIONS_LIST,
} from "@/features/variables/constants/variable";

interface Props {
  type: VARIABLE_TABS_VALUE;
  onChange: ({ key, step }: { key: VAR_OPTIONS_KEY; step?: number }) => void;
}

const Index = ({ type, onChange }: Props) => {
  const iconRender = (key: VAR_OPTIONS_KEY, icon: string) => {
    if (key === VAR_OPTIONS_KEY.ai_value) {
      return <img width={16} src={AiDescIcon} />;
    }
    return <AppIcon icon={icon} className={styles.icon} />;
  };

  const list = useMemo(() => {
    if (type === VARIABLE_TABS_VALUE.desc) {
      return DESC_OPTIONS_LIST;
    }
    return VAR_OPTIONS_LIST;
  }, [type]);

  return (
    <Flex vertical className={styles.optionsList}>
      {list.map(({ label, desc, key, icon }) => {
        return (
          <div
            key={key}
            onClick={() => onChange({ key })}
            className={styles.listItem}
          >
            <div className={classNames(styles.iconContent, styles[key] ?? key)}>
              {iconRender(key, icon)}
            </div>
            <Flex flex={1} gap={4} vertical>
              <span className={styles.label}>{label}</span>
              <span className={styles.desc}>{desc}</span>
            </Flex>
            <AppIcon rotate={-90} icon="chevron-down" className={styles.icon} />
          </div>
        );
      })}
    </Flex>
  );
};

export default Index;
