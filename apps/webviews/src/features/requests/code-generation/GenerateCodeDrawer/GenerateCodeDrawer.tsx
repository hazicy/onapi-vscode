import styles2 from "./GenerateCodeDrawer.module.css";
import React, { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";

import { Flex, Spin, message } from "@/shared/ui/base";

import { useDebounceFn, useSafeState } from "ahooks";
import clsx from "clsx";
import CodeEditor from "@/shared/components/CodeEditor/CodeEditor";
import Button from "@/shared/ui/Button";
import Drawer from "@/shared/ui/Drawer";
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
const GenerateCodeDrawer: React.FC<Props> = (props) => {
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
  const [menuKey, setMenuKey] = useSafeState<string>("curl.cURL");
  const [codeText, setCodeText] = useSafeState<string>("");
  const [editorLanguage, setEditorLanguage] =
    useSafeState<string>("javascript");
  const [genLoading, setGenLoading] = useSafeState<boolean>(false);

  const { varReplace } = useVarReplaces();
  const generateMenuDom = languages.flatMap((language) =>
    language.variants.map(({ key: variant }) => (
      <div
        className={clsx(styles2.menuItem, {
          [styles2.active]: `${language.key}.${variant}` === menuKey,
        })}
        key={`${language.key}.${variant}`}
        onClick={() => menuClick(language.key, variant)}
      >
        <AppIcon
          icon={
            ["shell", "curl"].includes(language.key) ? "terminal" : "file-code"
          }
          className={styles2.languagesIcon}
        />
        {`${language.label}(${variant})`}
      </div>
    )),
  );

  const requestCode = (language?: string, variant?: string) => {
    const requestId = crypto.randomUUID();
    pendingRequest.current = requestId;
    setGenLoading(true);
    setCodeText("");
    window.vscode.postMessage({
      action: "generateCode",
      data: { apiData: value, language, variant, requestId },
      option: { server_id: currentServerId },
    });
  };

  useEffect(() => {
    const receive = (event: MessageEvent) => {
      const { action, data } = event.data || {};
      if (
        action !== "generatedCode" ||
        data?.requestId !== pendingRequest.current
      ) {
        return;
      }
      setGenLoading(false);
      if (data.error) {
        catchError(data.error, t("supplement.generate_err"));
        return;
      }
      setLanguages(data.languages);
      setCodeText(varReplace(data.code));
      setMenuKey(`${data.language}.${data.variant}`);
      setEditorLanguage(data.syntax);
      const mode: [string, string] = [data.language, data.variant];
      window.vscode.postMessage({
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

  const { run: menuClick } = useDebounceFn(requestCode, { wait: 200 });

  return (
    <Drawer
      open
      title={t("common.code.title")}
      width={860}
      mask={true}
      maskClosable={true}
      onClose={onClose}
      styles={{
        body: {
          padding: 0,
        },
      }}
      extra={
        <Button
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
      }
    >
      <div className={styles2.container}>
        <Spin
          tip={t("supplement.generating")}
          spinning={genLoading}
          contentClassName={styles2.spinContainer}
          className={styles2.spinNestedLoading}
        >
          <Flex className={styles2.flex}>
            <div className={styles2.menu}>{generateMenuDom}</div>
            <div className={styles2.edit}>
              <CodeEditor readOnly language={editorLanguage} value={codeText} />
            </div>
          </Flex>
        </Spin>
      </div>
    </Drawer>
  );
};

export default GenerateCodeDrawer;
