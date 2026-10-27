import { useTranslation } from "react-i18next";
import styles from "./ParamsManage.module.css";

import { Flex, message } from "@/shared/ui/base";

import RequestGlobal from "@/features/requests/editor/RequestGlobal";
import Button from "@/shared/ui/Button";

import useProjectConfig from "@/features/project/store/useProjectConfig";
import { saveProjectConfig } from "@/features/requests/events/env";
import { FC } from "react";

const Index: FC<{ defaultTabKey?: string }> = ({
  defaultTabKey = "Headers",
}) => {
  const { t } = useTranslation();
  const http = useProjectConfig((state) => state.http!);
  const globalParams = http.collection;

  const onOk = () => {
    try {
      saveProjectConfig("http", http);
      message.success("Success");
    } catch (err) {
      /* empty */
    }
  };

  return (
    <div className={styles.container}>
      <Flex className={styles.paramsFlex} vertical gap={15}>
        <Flex vertical gap={15}>
          <span>{t("global_setting.key_detail.title")}</span>
          <span>{t("global_setting.key_detail.tips")}</span>
        </Flex>
        <div className={styles.paramsContent}>
          <RequestGlobal
            defaultTabKey={defaultTabKey}
            item={globalParams}
            onItemChange={(collection) =>
              useProjectConfig
                .getState()
                .updateProjectConfig({ http: { ...http, collection } })
            }
          />
        </div>
        <Flex justify="flex-end">
          <Button onClick={onOk} type="primary">
            {t("global_setting.key_detail.save")}
          </Button>
        </Flex>
      </Flex>
    </div>
  );
};

export default Index;
