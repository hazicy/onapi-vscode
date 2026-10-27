import styles from "./ImportContent.module.css";
import clsx from "clsx";
import React, { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import CodeEditor from "@/shared/components/CodeEditor/CodeEditor";
import useTheme from "@/shared/hooks/useTheme";

import { Flex, Input, Switch, Upload, message } from "@/shared/ui/base";
import type { RcFile, UploadChangeParam } from "@/shared/ui/base";

import JSON5 from "json5";
import { cloneDeep, includes, isArray, isEqual } from "lodash-es";

import { Button, AppIcon, Tooltip } from "@/shared/ui";
import {
  IMPORT_TIP_MAP,
  IMPORT_TYPE_ENUM,
  IMPORT_TYPE_MAP,
  ImportLocationEnum,
} from "@onapi/domain/settings/constants/settings";
import { useSafeState } from "ahooks";
import { parseSafeBash } from "@/features/curl/utils/curl";
import ImportApiPreview from "../ImportApiPreview";
import type { ImportOptions } from "./options";
import useImportData from "@/features/import/store/useImportData";
import axios from "axios";

const { Dragger } = Upload;

interface Props {
  options: ImportOptions;
  setOptions: React.Dispatch<React.SetStateAction<ImportOptions>>;
  importLocation: ImportLocationEnum;
  setImportLocation: React.Dispatch<ImportLocationEnum>;
  fileType: IMPORT_TYPE_ENUM;
  uploadFile: RcFile | null;
  setUploadFile: React.Dispatch<RcFile | null>;
  swaggerUrl?: string;
  setSwaggerUrl?: React.Dispatch<string>;
  onCancel?: () => void;
  setImportLoading?: React.Dispatch<boolean>;
}

const Index = ({
  options,
  setOptions,
  importLocation,
  uploadFile,
  swaggerUrl,
  setSwaggerUrl,
  fileType,
  onCancel,
  setImportLoading,
}: Props) => {
  const { t } = useTranslation();
  const { themeToken } = useTheme();
  const [value, setValue] = useSafeState<string>("");
  const {
    preview,
    updatePreview: setPreview,
    previewLoading,
    updatePreviewLoading: setPreviewLoading,
    previewData,
    updatePreviewData: setPreviewData,
    previewSelectData,
    updatePreviewSelectData: setPreviewSelectData,
  } = useImportData((store) => store);
  const [uploadKey, setUploadKey] = useState(Date.now());

  const accept = useMemo(() => {
    if (fileType === IMPORT_TYPE_ENUM.MD) {
      return ".md";
    }
    if (fileType === IMPORT_TYPE_ENUM.HAR) {
      return "application/json, .har";
    }
    return "application/json";
  }, [fileType]);

  const handleBeforeUpload = useCallback((file: File) => {
    if (!(file?.type === "application/json" || file?.type === "")) {
      message.error(t("supplement.upload_right_file"));
      return false;
    }
    setImportLoading && setImportLoading(true);
    // Return false directly to prevent auto upload (only used as selector)
    return false;
  }, []);

  const importFile = async (file: any, fileType: IMPORT_TYPE_ENUM) => {
    try {
      const chooseFolder = options.chooseFolder;
      window?.vscode.postMessage({
        action: "importData",
        data: { file, chooseFolder, fileType },
      });

      if (onCancel) {
        onCancel();
      }
    } catch (err) {}
  };

  const handleFileChange = async (info: UploadChangeParam) => {
    const file = info?.file?.originFileObj;
    if (info?.file.status === "removed") {
      setPreviewData({ apis: [], models: [], envs: [] });
    } else if (file) {
      const reader = new FileReader();
      reader.onerror = async () => {
        setImportLoading && setImportLoading(false);
        // Force reset after processing file
        setUploadKey(Date.now());
      };
      reader.onload = async () => {
        const text = String(reader.result) || "";
        await completePreviewData(file?.name, text);
        setImportLoading && setImportLoading(false);
        // Force reset after processing file
        setUploadKey(Date.now());
      };
      setImportLoading && setImportLoading(true);

      if ("text" in file) {
        try {
          const content = await file.text(); // Native async API
          setTimeout(async () => {
            await completePreviewData(file?.name, content);
            setImportLoading && setImportLoading(false);
            // Force reset after processing file
            setUploadKey(Date.now());
          }, 100);
        } catch (error) {}
      } else {
        reader.readAsText(file);
      }
    }
  };

  const completePreviewData = async (_fileName: string, text: string) => {
    try {
      setPreviewLoading(true);
      const formData = options;

      window?.vscode.postMessage({
        action: "getImportData",
        data: { json: JSON5.parse(text), fileType, formData },
      });
    } catch (err) {
      setPreviewLoading(false);
    }
  };

  const curlImportData = () => {
    if (fileType === IMPORT_TYPE_ENUM.CURL) {
      try {
        const parsedValue = parseSafeBash(value);

        window?.vscode.postMessage({
          action: "curlImport",
          data: parsedValue,
        });
      } catch (error) {}
      return;
    }
  };

  const projectImport2 = async () => {
    try {
      setPreviewLoading(true);
      // Filter unchecked data before importing
      const importData = cloneDeep(previewData);
      importData.apis = importData.apis.filter(
        (i) =>
          previewSelectData.apis.includes(i.id) ||
          (isArray(previewSelectData?.apiHalfs) &&
            previewSelectData.apiHalfs.includes(i.id)),
      );
      importData.models = importData.models.filter(
        (i) =>
          previewSelectData.models.includes(i.model_id) ||
          (isArray(previewSelectData?.modelHalfs) &&
            previewSelectData.modelHalfs.includes(i.model_id)),
      );
      const selectedEnvs = importData.envs.filter((i) =>
        previewSelectData.envs.includes(i.env_id),
      );
      const { chooseFolder } = options;
      window?.vscode.postMessage({
        action: "importData",
        data: {
          http: importData.http,
          newApis: importData.apis,
          newEnvs: selectedEnvs,
          chooseFolder: chooseFolder || "0",
          fileType,
        },
      });

      if (onCancel) {
        onCancel();
      }

      setPreview(false);
    } catch (error) {}
    setPreviewLoading(false);
  };

  const previewSwaggerUrlData = async () => {
    try {
      setPreviewLoading(true);
      if (fileType === IMPORT_TYPE_ENUM.SWAGGERURL) {
        if (!swaggerUrl) {
          setPreviewLoading(false);
          return message.info(t("supplement.input_url_first1"));
        }
        try {
          let text;
          const result = await axios.get(swaggerUrl);
          text = result?.data || {};
          const formData = options;
          window?.vscode.postMessage({
            action: "getImportData",
            data: { json: text, fileType, formData },
          });
        } catch (err: any) {
          message.error(t("supplement.upload_right_file"));
          setPreviewLoading(false);
        }
      }
    } catch (error) {
      setPreviewLoading(false);
    }
  };

  return (
    <>
      {fileType === IMPORT_TYPE_ENUM.CURL && (
        <Flex flex={1} style={{ minHeight: 0 }}>
          <CodeEditor
            className={styles.curlCodeEditor}
            onChange={setValue}
            value={value}
          />
        </Flex>
      )}
      {
        <>
          {fileType !== IMPORT_TYPE_ENUM.CURL && (
            <div>
              {(fileType === IMPORT_TYPE_ENUM.SWAGGER ||
                fileType === IMPORT_TYPE_ENUM.SWAGGERURL) && (
                <div className={styles.importProjectItem}>
                  <Flex
                    style={{ lineHeight: "32px", marginBottom: "20px" }}
                    align="center"
                    gap={20}
                  >
                    <Flex className={styles.importProjectFullTitle} gap={8}>
                      {t("supplement.path_handle")}
                      <Tooltip placement="top" title={t("supplement.swagger2")}>
                        <AppIcon
                          style={{
                            color: themeToken.iconColor,
                            cursor: "pointer",
                          }}
                          icon="info"
                        />
                      </Tooltip>
                    </Flex>
                    <Flex gap={20}>
                      <Flex gap={8} align="center">
                        {t("settings.import_project.basepath")}
                        <Switch
                          size="small"
                          checked={options.basePath}
                          onChange={(checked: boolean) =>
                            setOptions((current) => ({
                              ...current,
                              basePath: checked,
                            }))
                          }
                        />
                      </Flex>
                      <Flex gap={8} align="center">
                        {t("settings.import_project.host")}
                        <Switch
                          size="small"
                          checked={options.hostPath}
                          onChange={(checked: boolean) =>
                            setOptions((current) => ({
                              ...current,
                              hostPath: checked,
                            }))
                          }
                        />
                      </Flex>
                    </Flex>
                  </Flex>
                </div>
              )}

              <div className={styles.importProjectItem}>
                {!isEqual(fileType, IMPORT_TYPE_ENUM.CURL) && (
                  <div className={styles.importProjectItemTitle}>
                    {(IMPORT_TIP_MAP as any)?.[fileType] ||
                      t("settings.import_project.data_format")}
                  </div>
                )}

                <div className={styles.importProjectItemContent}>
                  {!includes(
                    [IMPORT_TYPE_ENUM.SWAGGERURL, IMPORT_TYPE_ENUM.CURL],
                    fileType,
                  ) && (
                    <Dragger
                      key={uploadKey}
                      className={clsx(
                        styles.importProjectUploadContent,
                        styles.uploadWrapper,
                      )}
                      itemClassName={styles.uploadListItem}
                      style={{
                        display: "block",
                      }}
                      accept={accept}
                      beforeUpload={handleBeforeUpload}
                      onChange={handleFileChange}
                      maxCount={1}
                      showUploadList={false}
                      iconRender={() => <AppIcon icon="link" />}
                    >
                      <p className={styles.antUploadDragIcon}>
                        <AppIcon icon="file-output" style={{ fontSize: 20 }} />
                      </p>
                      <p className="ant-upload-text">
                        {t("settings.import_project.file")}
                      </p>
                      <p
                        className="ant-upload-tips"
                        style={{ color: "var(--font-light-color)" }}
                      >
                        {t(IMPORT_TYPE_MAP[fileType].tips, {
                          fileType,
                        })}
                      </p>
                    </Dragger>
                  )}
                  {fileType === IMPORT_TYPE_ENUM.SWAGGERURL && (
                    <div
                      className={styles.swaggerInput}
                      style={{ marginBottom: 24 }}
                    >
                      <Input
                        value={swaggerUrl}
                        onChange={(e) => {
                          if (setSwaggerUrl) {
                            setSwaggerUrl(e?.target?.value);
                          }
                        }}
                        placeholder={t("settings.import_project.input_tip")}
                      />
                    </div>
                  )}
                </div>
              </div>
              <ImportApiPreview
                options={options}
                onOptionsChange={setOptions}
                loading={previewLoading}
                open={preview}
                onCancel={() => setPreview(false)}
                onProjectImport={projectImport2}
                data={previewData}
                importLocation={importLocation}
                fileType={fileType}
                previewSelectData={previewSelectData}
                setPreviewSelectData={setPreviewSelectData}
              />
            </div>
          )}
        </>
      }
      {fileType === IMPORT_TYPE_ENUM.SWAGGERURL && (
        <Flex justify="end">
          <Button
            loading={previewLoading}
            onClick={previewSwaggerUrlData}
            type="primary"
            className={styles.importExportNow}
          >
            {t("test.http_code.continue")}
          </Button>
        </Flex>
      )}

      {fileType === IMPORT_TYPE_ENUM.CURL && (
        <Flex justify="end">
          <Button
            loading={previewLoading}
            onClick={curlImportData}
            type="primary"
            className={styles.importExportNow}
          >
            {t("common.import_modal.title")}
          </Button>
        </Flex>
      )}
    </>
  );
};

export default Index;
