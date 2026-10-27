import styles from "./ResultList.module.css";
import { ceil, size } from "lodash-es";

import Empty from "@/shared/ui/Empty";

import EventItemComponent from "./EventItem";

type CommonTestingResultProps = {
  testingResult?: any[]; // Type determined at runtime
  isResult?: boolean;
  value: Array<any>;
  execute_count: number;
  eventCount: number;
};

const ResultList = ({
  value,
  execute_count,
  eventCount,
}: CommonTestingResultProps) => {
  return size(value) > 0 ? (
    <div className={styles.container}>
      {value.map((item: any, index: number) => {
        let iterationText = `${ceil((index + 1) / eventCount)}/${execute_count}`;
        return (
          <EventItemComponent
            value={item.data}
            iterationText={iterationText}
            errorMessage={item?.error?.message}
          />
        );
      })}
    </div>
  ) : (
    <Empty wrapStyle={{ marginTop: "40px" }} />
  );
};

export default ResultList;
