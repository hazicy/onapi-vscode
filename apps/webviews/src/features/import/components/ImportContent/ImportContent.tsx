import React, { useEffect, useRef, useState } from "react";
import { cloneDeep, isArray } from "lodash-es";
import {
  IMPORT_TYPE_ENUM,
  ImportLocationEnum,
} from "@onapi/domain/settings/constants/settings";
import ImportApiPreview from "../ImportApiPreview";
import type { ImportOptions } from "./options";
import useImportData from "../../store/useImportData";

interface Props {
  initialData: ReturnType<typeof useImportData.getState>["previewData"];
  options: ImportOptions;
  setOptions: React.Dispatch<React.SetStateAction<ImportOptions>>;
  importLocation: ImportLocationEnum;
  fileType: IMPORT_TYPE_ENUM;
  onCancel: () => void;
}

export default function ImportContent({
  initialData,
  options,
  setOptions,
  importLocation,
  fileType,
  onCancel,
}: Props) {
  const {
    preview,
    updatePreview: setPreview,
    previewLoading,
    updatePreviewLoading: setPreviewLoading,
    previewData,
    updatePreviewData: setPreviewData,
    previewSelectData,
    updatePreviewSelectData: setPreviewSelectData,
  } = useImportData();
  const [error, setError] = useState("");
  const pendingImport = useRef("");
  const fail = (error: unknown) => {
    setError(error instanceof Error ? error.message : String(error));
    setPreviewLoading(false);
  };
  useEffect(() => {
    setPreviewLoading(false);
    const receive = ({ data: response }: MessageEvent) => {
      if (!response.requestId || response.requestId !== pendingImport.current)
        return;
      if (response.action === "importComplete") {
        pendingImport.current = "";
        setPreviewLoading(false);
        setPreview(false);
        onCancel();
      } else if (response.action === "importError") {
        pendingImport.current = "";
        fail(response.data);
      }
    };
    window.addEventListener("message", receive);
    return () => {
      window.removeEventListener("message", receive);
      pendingImport.current = "";
    };
  }, [onCancel]);

  useEffect(() => {
    if (!initialData) return;
    const data = {
      ...initialData,
      envs: initialData.envs.map((env) => ({
        ...env,
        env_id:
          env.env_id ||
          (env as typeof env & { id?: string }).id ||
          crypto.randomUUID(),
      })),
    };
    setPreviewData(data);
    setPreviewSelectData({
      apis: data.apis.map((api) => api.id),
      models: data.models.map((model) => model.model_id),
      envs: data.envs.map((env) => env.env_id),
    });
    setPreview(true);
    setError("");
  }, [initialData]);

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

  return (
    <ImportApiPreview
      options={options}
      onOptionsChange={setOptions}
      loading={previewLoading}
      error={error}
      open={preview}
      onCancel={() => {
        if (!pendingImport.current) onCancel?.();
      }}
      onProjectImport={projectImport2}
      data={previewData}
      importLocation={importLocation}
      fileType={fileType}
      previewSelectData={previewSelectData}
      setPreviewSelectData={setPreviewSelectData}
    />
  );
}
