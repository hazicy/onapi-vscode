import styles from "./Export.module.css";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { Typography } from "@/shared/ui/base";

import ExportComponent from "./ExportComponent";

const { Title } = Typography;

const Export = () => {
  const { t } = useTranslation();
  const pending = useRef("");
  const [stage, setStage] = useState("");
  const [error, setError] = useState("");
  const loading = ["preparing", "choosingLocation", "saving"].includes(stage);
  useEffect(() => {
    const receive = ({ data: response }: MessageEvent) => {
      if (
        response?.action !== "exportStatus" ||
        !pending.current ||
        response.requestId !== pending.current
      ) {
        return;
      }
      setStage(response.data.stage);
      if (response.data.stage === "error") {
        setError(response.data.error);
      }
      if (["complete", "cancelled", "error"].includes(response.data.stage)) {
        pending.current = "";
      }
    };
    window.addEventListener("message", receive);
    return () => {
      window.removeEventListener("message", receive);
      pending.current = "";
    };
  }, []);
  const onClick = ({ exportType, version }: { [key: string]: string }) => {
    if (pending.current) {
      return;
    }
    const requestId = crypto.randomUUID();
    pending.current = requestId;
    setError("");
    setStage("preparing");
    window.vscode.postMessage({
      action: "exportProjectData",
      requestId,
      data: { type: exportType, version },
    });
  };
  return (
    <div className={styles.container}>
      <Title style={{ fontSize: 16 }} level={3}>
        {t("settings.export_project.title")}
      </Title>
      <ExportComponent
        onClick={onClick}
        loading={loading}
        status={stage ? t(`interaction.export_${stage}`) : ""}
        error={error}
      />
    </div>
  );
};

export default Export;
