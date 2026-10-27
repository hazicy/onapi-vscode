import styles from "./InvalidUrl.module.css";
import { Flex } from "@/shared/ui/base";
import { useTranslation } from "react-i18next";

import { Typography } from "@/shared/ui/base";

import AppIcon from "@/shared/ui/AppIcon";

type InvalidUrlProps = {
  url: string;
};

export const InvalidUrl = ({ url }: InvalidUrlProps) => {
  const { t } = useTranslation();
  return (
    <Flex
      vertical
      gap={12}
      align="center"
      justify="center"
      className={styles.container}
    >
      <AppIcon className={styles.icon} icon="unplug" />
      <Typography.Text className={styles.text}>
        {t("supplement.invalid_url")} {url}
      </Typography.Text>
    </Flex>
  );
};
