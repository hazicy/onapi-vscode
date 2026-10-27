import styles from "./index.module.css";
import { useTranslation } from "react-i18next";

import { Typography } from "@/shared/ui/base";

import { EXPORT_TYPE_ENUM } from "@onapi/http-model/settings/constants/settings";
import ExportComponent from "./ExportComponent";

const { Title } = Typography;

const Export = () => {
  const { t } = useTranslation();
  const onClick = async ({
    exportType,
    version,
  }: {
    [key: string]: string;
  }) => {
    if (exportType === EXPORT_TYPE_ENUM.onapi) {
    }
    window?.vscode.postMessage({
      action: "exportProjectData",
      data: {
        type: exportType,
        version,
      },
    });
  };
  return (
    <div className={styles.container}>
      <Title style={{ fontSize: 16 }} level={3}>
        {t("settings.export_project.title")}
      </Title>
      <ExportComponent onClick={onClick} />
    </div>
  );
};

export default Export;
