import styles from "./ImportContent.module.css";
import clsx from "clsx";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import CodeEditor from "@/shared/components/CodeEditor/CodeEditor";
import useTheme from "@/shared/hooks/useTheme";

import { Alert, Flex, Input, Switch, Upload } from "@/shared/ui/base";
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

  const [error, setError] = useState("");
  const pendingPreview = useRef("");
  const pendingImport = useRef("");

  const fail = (error: unknown) => {
    setError(error instanceof Error ? error.message : String(error));
    setPreviewLoading(false);
    setImportLoading?.(false);
  };

  useEffect(() => {
    setError("");
    setPreviewLoading(false);
    setImportLoading?.(false);
    const receive = ({ data: response }: MessageEvent) => {
      if (!response?.requestId) {
        return;
      }
      if (response.requestId === pendingPreview.current) {
        if (response.action === "setImportData") {
          const data = response.data;
          data.envs = (data.envs || []).map((env: any) => ({
            ...env,
            env_id: env.env_id || env.id,
          }));
          setPreviewData(data);
          setPreviewSelectData({
            apis:
              response.type === "select_envs"
                ? []
                : (data.apis || []).map((api: any) => api.id),
            models:
              response.type === "select_envs"
                ? []
                : (data.models || []).map((model: any) => model.model_id),
            envs:
              response.type === "select_envs"
                ? data.envs.map((env: any) => env.env_id)
                : [],
          });
          setPreview(true);
          setPreviewLoading(false);
          setImportLoading?.(false);
          pendingPreview.current = "";
        } else if (response.action === "importError") {
          fail(response.data);
          pendingPreview.current = "";
        }
      } else if (response.requestId === pendingImport.current) {
        if (response.action === "importComplete") {
          pendingImport.current = "";
          setPreviewLoading(false);
          setImportLoading?.(false);
          setPreview(false);
          onCancel?.();
        } else if (response.action === "importError") {
          pendingImport.current = "";
          fail(response.data);
        }
      }
    };
    window.addEventListener("message", receive);
    return () => {
      window.removeEventListener("message", receive);
      pendingPreview.current = "";
      pendingImport.current = "";
    };
  }, [fileType]);

  const requestPreview = (json: unknown, requestId = crypto.randomUUID()) => {
    pendingPreview.current = requestId;
    setError("");
    setPreviewLoading(true);
    setImportLoading?.(true);
    window.vscode.postMessage({
      action: "getImportData",
      requestId,
      data: { json, fileType, formData: options },
    });
  };

  const handleBeforeUpload = (file: File) => {
    if (file.type && file.type !== "application/json") {
      fail(new Error(t("supplement.upload_right_file")));
    }
    return false;
  };

  const handleFileChange = async (info: UploadChangeParam) => {
    const file = info.file?.originFileObj;
    if (info.file?.status === "removed") {
      setPreviewData({ apis: [], models: [], envs: [] });
      return;
    }
    if (!file || (file.type && file.type !== "application/json")) {
      return;
    }
    const requestId = crypto.randomUUID();
    pendingPreview.current = requestId;
    setError("");
    setImportLoading?.(true);
    try {
      const text = await file.text();
      if (pendingPreview.current !== requestId) {
        return;
      }
      requestPreview(JSON5.parse(text), requestId);
    } catch (error) {
      if (pendingPreview.current === requestId) {
        pendingPreview.current = "";
        fail(error);
      }
    } finally {
      setUploadKey(Date.now());
    }
  };

  const curlImportData = () => {
    try {
      setError("");
      window.vscode.postMessage({
        action: "curlImport",
        data: parseSafeBash(value),
      });
    } catch (error) {
      fail(error);
    }
  };

  const projectImport2 = async () => {
    if (pendingImport.current) {
      return;
    }
    try {
      setError("");
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
      const requestId = crypto.randomUUID();
      pendingImport.current = requestId;
      window?.vscode.postMessage({
        action: "importData",
        requestId,
        data: {
          http: importData.http,
          newApis: importData.apis,
          newEnvs: selectedEnvs,
          chooseFolder: chooseFolder || "0",
          fileType,
        },
      });
    } catch (error) {
      pendingImport.current = "";
      fail(error);
    }
  };

  const previewSwaggerUrlData = async () => {
    if (!swaggerUrl) {
      fail(new Error(t("supplement.input_url_first1")));
      return;
    }
    const requestId = crypto.randomUUID();
    pendingPreview.current = requestId;
    setError("");
    setImportLoading?.(true);
    try {
      const result = await axios.get(swaggerUrl);
      if (pendingPreview.current !== requestId) {
        return;
      }
      requestPreview(result.data, requestId);
    } catch (error) {
      if (pendingPreview.current === requestId) {
        pendingPreview.current = "";
        fail(error);
      }
    }
  };

  return (
    <>
      {error && !preview && (
        <Alert
          type="error"
          message={t("interaction.importFailed")}
          description={error}
        />
      )}
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
                error={error}
                open={preview}
                onCancel={() => {
                  if (!pendingImport.current) {
                    setPreview(false);
                  }
                }}
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
