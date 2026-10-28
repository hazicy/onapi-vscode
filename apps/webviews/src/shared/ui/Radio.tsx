import styles from "./Radio.module.css";
import { Radio as BaseRadio } from "@/shared/ui/base";
import type { RadioGroupProps, RadioProps } from "@/shared/ui/base";

const Radio = (props: RadioProps) => {
  return (
    <div className={styles.container}>
      <BaseRadio
        {...props}
        indicatorClassName={styles.radioInner}
        controlClassName={styles.radio}
      />
    </div>
  );
};
const Group = (props: RadioGroupProps) => {
  return (
    <div className={styles.radioGroup}>
      <BaseRadio.Group
        {...props}
        className={styles.radioGroup}
      ></BaseRadio.Group>
    </div>
  );
};
Radio.Group = Group;
export default Radio;
