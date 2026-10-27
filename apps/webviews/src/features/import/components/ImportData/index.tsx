import styles from "./index.module.css";
import { Flex } from "@/shared/ui/base";

import ImportProjectManual from "./ImportProjectManual";

const importData = () => {
  return (
    <Flex vertical className={styles.container}>
      <ImportProjectManual />
    </Flex>
  );
};
export default importData;
