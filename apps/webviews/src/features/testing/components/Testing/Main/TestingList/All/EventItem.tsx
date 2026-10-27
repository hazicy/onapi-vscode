import styles from "./index.module.css";
import PrefixIcon from "@/shared/ui/PrefixIcon";
import { STATUS_CODE } from "@onapi/http-model/constants/common";
import { Checkbox, Flex, Tooltip, Typography } from "@/shared/ui/base";

type EventItemProps = {
  value: {
    method: string;
    name: string;
    url: string;
    enabled: STATUS_CODE;
  };
  onChange: (val: any) => void;
};

const EventItem = (props: EventItemProps) => {
  const { value, onChange } = props;
  return (
    <Flex justify="space-between" className={styles.item}>
      <Flex style={{ overflow: "hidden" }} gap={16}>
        <Checkbox
          checked={value.enabled === STATUS_CODE.ENABLE}
          onChange={(event) => {
            const value = event.target.checked;
            onChange({
              enabled: value ? STATUS_CODE.ENABLE : STATUS_CODE.DISABLE,
            });
          }}
        />
        <Flex gap={16}>
          <PrefixIcon type="api" method={value.method} />
        </Flex>
        {value?.url && (
          <Tooltip placement="topLeft" title={value.url}>
            <Typography.Text ellipsis style={{ flex: 1 }}>
              {value.url}
            </Typography.Text>
          </Tooltip>
        )}
      </Flex>
    </Flex>
  );
};

export default EventItem;
