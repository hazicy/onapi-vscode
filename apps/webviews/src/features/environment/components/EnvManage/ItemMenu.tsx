import styles from "./ItemMenu.module.css";
import React from "react";
import { useTranslation } from "react-i18next";

import { Dropdown, Flex } from "@/shared/ui/base";

import Button from "@/shared/ui/Button";
import AppIcon from "@/shared/ui/AppIcon";

type Props = {
  enableDel: boolean;
  onDelete: () => void;
  onModify: () => void;
  onDefault: () => void;
};

const Index: React.FC<Props> = (props) => {
  const { t } = useTranslation();
  const { enableDel, onDelete, onModify, onDefault } = props;

  const handleModify = () => {
    onModify();
  };

  const handleDelete = () => {
    if (!enableDel) {
      return;
    }
    onDelete();
  };

  const handleDefault = () => {
    onDefault();
  };

  const items = [
    {
      key: "0",
      label: "Set Default",
      icon: <AppIcon icon="arrow-right" className={styles.icon} />,
      onClick: handleDefault,
    },
    {
      key: "1",
      label: t("global_setting.environment_detail.edit_name"),
      icon: <AppIcon icon="pencil" className={styles.icon} />,
      onClick: handleModify,
    },
    {
      key: "2",
      label: (
        <Flex style={{ cursor: enableDel === false ? "not-allowed" : "" }}>
          {t("global_setting.environment_detail.delete_server")}
        </Flex>
      ),
      icon: <AppIcon icon="trash-2" className={styles.icon} />,
      onClick: handleDelete,
    },
  ];

  return (
    <Dropdown
      menu={{
        items,
      }}
      trigger={["click"]}
    >
      <div>
        <AppIcon icon="ellipsis" className={styles.icon} />
      </div>
    </Dropdown>
  );
};

export default Index;
