import styles from "./ImportProjectManual.module.css";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";

import { Spin, Typography } from "@/shared/ui/base";
import type { RcFile } from "@/shared/ui/base";

import { useSafeState } from "ahooks";
import classnames from "classnames";

import ImportContent from "@/features/import/components/ImportContent";
import { createImportOptions } from "@/features/import/components/ImportContent/options";

import AppIcon from "@/shared/ui/AppIcon";
import Radio from "@/shared/ui/Radio";
import Tooltip from "@/shared/ui/Tooltip";

import {
  IMPORT_TYPE_ENUM,
  IMPORT_TYPE_LIST,
  ImportLocationEnum,
} from "@onapi/http-model/settings/constants/settings";
import useSystemConfig from "@/features/settings/store/useSystemConfig";
import { isString } from "lodash";

const { Title } = Typography;

const ImportProjectManual = () => {
  const [fileType, setFileType] = useSafeState<IMPORT_TYPE_ENUM>(
    IMPORT_TYPE_ENUM.CURL,
  );
  const [uploadFile, setUploadFile] = useSafeState<RcFile | null>(null);
  const [importLocation, setImportLocation] = useSafeState<ImportLocationEnum>(
    ImportLocationEnum.append,
  );

  const [importLoading, setImportLoading] = useSafeState<boolean>(false);

  const import_data_init_type = useSystemConfig(
    (i) => i?.systemConfig?.import_data_init_type,
  );

  useEffect(() => {
    if (isString(import_data_init_type) && import_data_init_type.length > 0) {
      setFileType(import_data_init_type);
    }
  }, [import_data_init_type]);

  const [options, setOptions] = useSafeState(createImportOptions);
  const [swaggerUrl, setSwaggerUrl] = useSafeState<string>("");
  const { t } = useTranslation();

  const contentProps = {
    options,
    setOptions,
    importLocation,
    setImportLocation,
    uploadFile,
    setUploadFile,
    swaggerUrl,
    setSwaggerUrl,
    fileType,
    setImportLoading,
  };

  return (
    <Spin spinning={importLoading}>
      <div className={styles.importExport}>
        <Title style={{ fontSize: "16px" }} level={3}>
          {t("settings.import_project.title")}
        </Title>
        <div className={styles.importProjectItem}>
          <div className={styles.importProjectItemTitle}>
            {t("settings.import_project.source")}
          </div>
          <div className={styles.importProjectItemContent}>
            <Radio.Group value={fileType} className={styles.radioGroup}>
              {IMPORT_TYPE_LIST.map((item: any) => (
                <Tooltip
                  title={item?.disabled ? t("supplement.will_online") : ""}
                >
                  <div
                    key={item.key}
                    className={classnames({
                      [styles.radioCard]: true,
                      [styles.active]: item.key === fileType,
                    })}
                  >
                    <Radio
                      key={item.key}
                      value={item.key}
                      disabled={item?.disabled}
                      onClick={() => {
                        setUploadFile(null);
                        if (
                          ![
                            IMPORT_TYPE_ENUM.SWAGGER,
                            IMPORT_TYPE_ENUM.SWAGGERURL,
                            IMPORT_TYPE_ENUM.POSTMAN,
                            IMPORT_TYPE_ENUM.INSOMNIA,
                            IMPORT_TYPE_ENUM.THUNDER_CLIENT,
                            IMPORT_TYPE_ENUM.ONAPI,
                            IMPORT_TYPE_ENUM.CURL,
                          ].includes(item.key)
                        ) {
                          setImportLocation(ImportLocationEnum.create);
                        }
                        setFileType(item.key);
                        setOptions(createImportOptions());
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
                </Tooltip>
              ))}
            </Radio.Group>
          </div>
        </div>
        <ImportContent {...contentProps} />
      </div>
    </Spin>
  );
};

export default ImportProjectManual;
