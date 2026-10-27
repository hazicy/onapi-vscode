import classNames from "classnames";
import styles from "../../index.module.css";
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
        className={classNames(styles.wsHeader, styles.flex)}
      >
        <Flex
          align="center"
          gap={8}
          style={{ wordBreak: "keep-all" }}
          className={styles.flex}
        >
          <Input
            prefix={<AppIcon icon="search" className={styles.iconColor} />}
            placeholder={t("ws.response.search_tip")}
            value={filterValue}
            onChange={(e) => setFilterValue(e?.target?.value || "")}
            size="small"
            outlinedClassName={styles.inputOutlined}
          />
          <Select
            getPopupContainer={(triggerNode: HTMLElement) =>
              triggerNode.parentNode as HTMLElement
            }
            value={filterType}
            onChange={setFilterType}
            size="small"
            optionClassName={styles.selectItem}
            popupClassName={styles.selectDropdown}
            triggerClassName={styles.selectTrigger}
            className={styles.select}
          >
            <Select.Option
              value="all"
              optionClassName={styles.selectItem}
              popupClassName={styles.selectDropdown}
              triggerClassName={styles.selectTrigger}
              className={styles.select}
            >
              {t("ws.response.all_message")}
            </Select.Option>
            <Select.Option
              value="send"
              optionClassName={styles.selectItem}
              popupClassName={styles.selectDropdown}
              triggerClassName={styles.selectTrigger}
              className={styles.select}
            >
              {t("ws.response.sent")}
            </Select.Option>
            <Select.Option
              value="message"
              optionClassName={styles.selectItem}
              popupClassName={styles.selectDropdown}
              triggerClassName={styles.selectTrigger}
              className={styles.select}
            >
              {t("ws.response.received")}
            </Select.Option>
          </Select>
          <Button
            style={{ height: 32, borderColor: "var(--color-table-border)" }}
            size="small"
            icon={<AppIcon icon="trash-2" />}
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
