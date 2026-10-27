import { requestUrl, requestMethod } from "@onapi/http-model";
import styles from "./index.module.css";
import { size } from "lodash";

import Empty from "@/shared/ui/Empty";

import { EventItem } from "@onapi/http-model/testing/types/index";
import EventItemComponent from "./EventItem";

type CommonTestingResultProps = {
  testingResult?: any[]; // Type determined at runtime
  isResult?: boolean;
  value: Array<EventItem>;
  onChange: (index: number, obj: any) => void;
  containerRef?: React.RefObject<HTMLDivElement>;
};

const All = ({ value, onChange }: CommonTestingResultProps) => {
  return size(value) > 0 ? (
    <div className={styles.container}>
      {value.map((item: EventItem, index: number) => {
        return (
          <EventItemComponent
            value={{
              ...item.data,
              url: requestUrl(item.data),
              method: requestMethod(item.data),
              enabled: item.enabled,
            }}
            onChange={(val) => {
              onChange(index, val);
            }}
          />
        );
      })}
    </div>
  ) : (
    <Empty />
  );
};

export default All;
