import React from "react";
import { useTranslation } from "react-i18next";
import styles from "./ExportComponent.module.css";

import { Flex, message } from "@/shared/ui/base";

import { useSafeState } from "ahooks";
import clsx from "clsx";

import AppIcon from "@/shared/ui/AppIcon";
import Button from "@/shared/ui/Button";
import Radio from "@/shared/ui/Radio";
import { EXPORT_TYPE_LIST } from "@onapi/domain/settings/constants/settings";

interface Props {
  onClick?: ({ exportType, version }: { [k: string]: string }) => Promise<void>;
}
const Export = (props: Props) => {
  const { onClick } = props || {};
  const { t } = useTranslation();

  const [loading, setLoading] = useSafeState<boolean>(false);
  const [exportType, setExportType] = useSafeState<string>("onapi");
  const [version, setVersion] = useSafeState<string>("3.0");

  const exportHandle = async () => {
    try {
      setLoading(true);
      await onClick?.({ exportType, version });
    } catch (err: any) {
      message.error(err?.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.importProjectItem}>
        <div className={styles.importProjectItemTitle}>
          {t("settings.export_project.data_format")}
        </div>
        <div className={styles.importProjectItemContent}>
          <Radio.Group value={exportType} className={styles.radioGroup}>
            {EXPORT_TYPE_LIST.map((item) => (
              <React.Fragment key={item.key}>
                <div
                  key={item.key}
                  className={clsx({
                    [styles.radioCard]: true,
                    [styles.active]: item.key === exportType,
                  })}
                >
                  <Radio
                    key={item.key}
                    value={item.key}
                    onClick={() => {
                      setExportType(item.key);
                    }}
                    controlClassName={styles.radio}
                    className={styles.radioWrapper}
                    indicatorClassName={styles.radioInner}
                  >
                    <span className={styles.radioCardContent}>
                      <AppIcon icon={item.icon} />
                      {item.value}
                    </span>
                  </Radio>
                </div>
              </React.Fragment>
            ))}
          </Radio.Group>
        </div>
      </div>
      {exportType === "swagger" && (
        <div className={styles.importProjectItem}>
          <div className={styles.importProjectItemTitle}>
            {t("settings.export_project.version")}
          </div>
          <div className={styles.importProjectItemContent}>
            <Radio.Group
              value={version}
              onChange={(e) => setVersion(e?.target?.value)}
              className={clsx(styles.marginBottom20, styles.radioGroup)}
            >
              <Radio
                value="3.0"
                controlClassName={styles.radio}
                className={styles.radioWrapper}
                indicatorClassName={styles.radioInner}
              >
                3.0
              </Radio>
              <Radio
                value="2.0"
                controlClassName={styles.radio}
                className={styles.radioWrapper}
                indicatorClassName={styles.radioInner}
              >
                2.0
              </Radio>
            </Radio.Group>
          </div>
        </div>
      )}
      <Flex justify="end">
        <Button
          loading={loading}
          // disabled
          onClick={exportHandle}
          type="primary"
          className={styles.importExportNow}
        >
          {t("settings.export_project.export")}
        </Button>
      </Flex>
    </div>
  );
};

export default Export;
