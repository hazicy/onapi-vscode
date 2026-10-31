import clsx from "clsx";
import styles from "../../SocketIoDebug.module.css";
import { useTranslation } from "react-i18next";

import { Flex, Input, Select } from "@/shared/ui/base";

import Button from "@/shared/ui/Button";
import AppIcon from "@/shared/ui/AppIcon";
import useWebSocketStore from "@/features/requests/store/useApis/websocket";

interface Props {
  filterValue: string;
  setFilterValue: (value: string) => void;
  filterType: string;
  setFilterType: (value: string) => void;
  id: string;
}
const Header = (props: Props) => {
  const { t } = useTranslation();
  const { filterValue, setFilterValue, filterType, setFilterType, id } =
    props || {};
  const websocketConnectionPool = useWebSocketStore(
    (state) => state.websocketConnectionPool,
  );
  const updateWebSocketConnectionPool = useWebSocketStore(
    (state) => state.updateWebSocketConnectionPool,
  );

  return (
    <>
      <Flex
        justify="space-between"
        className={clsx(styles.wsHeader, styles.flex)}
      >
        <Flex
          align="center"
          gap={8}
          style={{ wordBreak: "keep-all" }}
          className={styles.messageFilters}
        >
          <Input
            prefix={<AppIcon icon="search" className={styles.iconColor} />}
            aria-label={t("ws.response.search_tip")}
            className={styles.messageSearch}
            placeholder={t("ws.response.search_tip")}
            value={filterValue}
            onChange={(e) => setFilterValue(e?.target?.value || "")}
            size="small"
            outlinedClassName={styles.inputOutlined}
          />
          <Select
            aria-label={t("ws.response.message_type")}
            value={filterType}
            onChange={setFilterType}
            size="small"
            optionClassName={styles.selectItem}
            popupClassName={styles.selectDropdown}
            triggerClassName={styles.selectTrigger}
            className={styles.select}
          >
            <Select.Option value="all" className={styles.select}>
              {t("ws.response.all_message")}
            </Select.Option>
            <Select.Option value="send" className={styles.select}>
              {t("ws.response.sent")}
            </Select.Option>
            <Select.Option value="message" className={styles.select}>
              {t("ws.response.received")}
            </Select.Option>
          </Select>
          <Button
            style={{ height: 32, borderColor: "var(--color-table-border)" }}
            size="small"
            icon={<AppIcon icon="trash-2" />}
            disabled={!websocketConnectionPool[id]?.socketRes?.length}
            onClick={() =>
              updateWebSocketConnectionPool({
                ...websocketConnectionPool,
                [id]: {
                  ...websocketConnectionPool[id],
                  socketRes: [],
                },
              })
            }
            className={styles.button}
          >
            {t("ws.response.clear")}
          </Button>
        </Flex>
      </Flex>
    </>
  );
};

export default Header;
