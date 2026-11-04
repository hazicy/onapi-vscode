import { useState } from "react";
import { useTranslation } from "react-i18next";
import ImportContent from "./ImportContent/ImportContent";
import { createImportOptions } from "./ImportContent/options";
import useImportData from "../store/useImportData";
import {
  IMPORT_TYPE_ENUM,
  ImportLocationEnum,
} from "@onapi/domain/settings/constants/settings";
import styles from "./ImportPreview.module.css";

export type ImportPreviewSource = {
  fileType: IMPORT_TYPE_ENUM;
  name: string;
  data: ReturnType<typeof useImportData.getState>["previewData"];
};

export default function ImportPreview({
  source,
}: {
  source: ImportPreviewSource;
}) {
  const { t } = useTranslation();
  const [options, setOptions] = useState(createImportOptions);
  return (
    <main className={styles.container}>
      <div className={styles.source} title={source.name}>
        {t("importSource.source")}: {source.name}
      </div>
      <ImportContent
        options={options}
        setOptions={setOptions}
        importLocation={ImportLocationEnum.append}
        fileType={source.fileType}
        initialData={source.data}
        onCancel={() =>
          window.vscode.postMessage({ action: "closeImportPreview" })
        }
      />
    </main>
  );
}
