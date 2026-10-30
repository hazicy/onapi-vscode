import {
  sendRequestPanelMessage,
  readRequestPanelResponse,
} from "@/shared/bridge/request-panel";
import styles from "./GenerateCodeModal.module.css";
import React, { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";

import { Select, Spin, message } from "@/shared/ui/base";

import { useSafeState } from "ahooks";
import CodeEditor from "@/shared/components/CodeEditor/CodeEditor";
import Button from "@/shared/ui/Button";
import Modal from "@/shared/ui/Modal";
import AppIcon from "@/shared/ui/AppIcon";
import useVarReplaces from "@/features/variables/hooks/useVarReplaces";
import { copyStringToClipboard } from "@/shared/utils/common";
import { catchError } from "@/shared/utils/notify";

import useApis from "@/features/requests/store/useApis";
import useSystemConfig from "@/features/settings/store/useSystemConfig";

interface Props {
  value: any;
  onClose: () => void;
}
interface CodeLanguage {
  key: string;
  label: string;
  syntax_mode: string;
  variants: { key: string }[];
}
const GenerateCodeModal: React.FC<Props> = (props) => {
  const { t } = useTranslation();
  const { value, onClose } = props || {};

  const currentServerId = useApis((state) => state.currentServerId);

  const updateSystemConfig = useSystemConfig(
    (store) => store.updateSystemConfig,
  );
  const generate_code_mode = useSystemConfig(
    (store) => store.systemConfig?.generate_code_mode,
  );

  const [languages, setLanguages] = useSafeState<CodeLanguage[]>([]);
  const pendingRequest = useRef("");
  const [selection, setSelection] = useSafeState({
    language: generate_code_mode?.[0] || "curl",
    variant: generate_code_mode?.[1] || "cURL",
  });
  const [codeText, setCodeText] = useSafeState<string>("");
  const [editorLanguage, setEditorLanguage] =
    useSafeState<string>("javascript");
  const [genLoading, setGenLoading] = useSafeState<boolean>(true);

  const { varReplace } = useVarReplaces();
  const selectedLanguage = languages.find(
    (language) => language.key === selection.language,
  );

  const requestCode = (language?: string, variant?: string) => {
    const requestId = crypto.randomUUID();
    pendingRequest.current = requestId;
    setGenLoading(true);
    if (language && variant) {
      setSelection({ language, variant });
    }
    sendRequestPanelMessage({
      action: "generateCode",
      requestId,
      data: { apiData: value, language, variant, requestId },
      option: { server_id: currentServerId },
    });
  };

  useEffect(() => {
    const receive = (event: MessageEvent) => {
      const parsed = readRequestPanelResponse(event.data);
      if (
        parsed?.action === "requestPanelError" &&
        parsed.requestId === pendingRequest.current
      ) {
        setGenLoading(false);
        setCodeText("");
        catchError(parsed.data.error.message, t("supplement.generate_err"));
        return;
      }
      if (parsed?.action !== "generatedCode") {
        return;
      }
      const { action, data } = parsed;
      if (
        action !== "generatedCode" ||
        data?.requestId !== pendingRequest.current
      ) {
        return;
      }
      setGenLoading(false);
      if ("error" in data) {
        setCodeText("");
        catchError(data.error, t("supplement.generate_err"));
        return;
      }
      setLanguages(data.languages || []);
      setCodeText(varReplace(data.code || ""));
      setSelection({ language: data.language, variant: data.variant });
      setEditorLanguage(data.syntax || "text");
      const mode: [string, string] = [
        data.language || "curl",
        data.variant || "cURL",
      ];
      sendRequestPanelMessage({
        action: "setSystemConfig",
        data: { generate_code_mode: mode },
      });
      updateSystemConfig({
        ...useSystemConfig.getState().systemConfig,
        generate_code_mode: mode,
      });
    };
    window.addEventListener("message", receive);
    requestCode(generate_code_mode?.[0], generate_code_mode?.[1]);
    return () => {
      window.removeEventListener("message", receive);
      pendingRequest.current = "";
    };
  }, []);

  return (
    <Modal
      open
      title={t("common.code.title")}
      width={900}
      onCancel={onClose}
      focusTriggerAfterClose
      className={styles.modal}
      headerClassName={styles.header}
      bodyClassName={styles.body}
      footer={null}
      styles={{
        content: { padding: 0 },
        header: { margin: 0 },
      }}
    >
      <div className={styles.container}>
        <div className={styles.toolbar}>
          <Select
            aria-label={t("common.code.language")}
            value={selection.language}
            disabled={!languages.length}
            className={styles.languageSelect}
            options={languages.map((language) => ({
              value: language.key,
              label: language.label,
            }))}
            onChange={(key: string) => {
              const language = languages.find((item) => item.key === key);
              const variant = language?.variants[0]?.key;
              if (language && variant) {
                requestCode(language.key, variant);
              }
            }}
          />
          <Select
            aria-label={t("common.code.library")}
            value={selection.variant}
            disabled={!selectedLanguage?.variants.length}
            className={styles.librarySelect}
            options={
              selectedLanguage?.variants.map(({ key }) => ({
                value: key,
                label: key,
              })) ?? []
            }
            onChange={(variant: string) =>
              requestCode(selection.language, variant)
            }
          />
          <Button
            className={styles.copyButton}
            disabled={genLoading || !codeText}
            onClick={() =>
              copyStringToClipboard(codeText, () =>
                message.success(t("supplement.copy_success")),
              )
            }
            icon={<AppIcon icon="copy" />}
            size="small"
            mode="light"
          >
            {t("common.code.copy")}
          </Button>
        </div>
        <Spin
          tip={t("supplement.generating")}
          spinning={genLoading}
          contentClassName={styles.editorContent}
          className={styles.editor}
        >
          <CodeEditor readOnly language={editorLanguage} value={codeText} />
        </Spin>
      </div>
    </Modal>
  );
};

export default GenerateCodeModal;
