import styles from "./ToolBar.module.css";
import { Flex } from "@/shared/ui/base";
import TitleEdit from "@/shared/ui/TitleEdit";

import LayoutControl from "@/shared/components/ResizablePanels/LayoutControl";

interface Props<T extends { name: string }> {
  showLayoutControl?: boolean;
  apisData: T;
  onApisDataChange: (data: T) => void;
}
function ToolBar<T extends { name: string }>({
  apisData,
  onApisDataChange,
  showLayoutControl,
}: Props<T>) {
  return (
    <div className={styles.container}>
      <Flex
        gap={4}
        className={styles.tabBarExtraContentWrap}
        align="center"
        justify="space-between"
      >
        <Flex gap={8} align="center" className={styles.editWrap} flex={1}>
          <TitleEdit
            maxLength={255}
            className={styles.apisTitleEdit}
            value={apisData?.name}
            onChange={(event) =>
              onApisDataChange({ ...apisData, name: event.target.value })
            }
          />
        </Flex>
        {showLayoutControl && <LayoutControl />}
      </Flex>
    </div>
  );
}

export default ToolBar;
