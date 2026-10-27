import { useMemo, type ReactNode } from "react";
import { useShallow } from "zustand/react/shallow";
import { useGlobal } from "@/app/store";
import useSystemConfig from "@/features/settings/store/useSystemConfig";
import VarInput from "@/features/variables/components/VarInput/VarInput";
import VarInsertPop from "@/features/variables/components/VarInsertPop/VarInsertPop";
import { VAR_OPTIONS_KEY } from "@/features/variables/constants/variable";
import { getEditorVariable } from "@/features/variables/utils/editor-variable";
import { InsertAction } from "@onapi/domain/requests/types/variable";
import { EditorPreferencesContext } from "@/shared/contexts/editor-preferences";
import {
  VariableControlsContext,
  type VariableInsertProps,
} from "@/shared/contexts/variable-controls";
import {
  SystemHeadersContext,
  type SystemHeaders,
} from "@/shared/contexts/system-headers";

function VariableInsert({ onChange, ...props }: VariableInsertProps) {
  return (
    <VarInsertPop
      {...props}
      placement="right"
      onChange={(value, operation, action) => {
        onChange(
          value,
          operation === VAR_OPTIONS_KEY.desc ||
            operation === VAR_OPTIONS_KEY.ai_desc
            ? "description"
            : "value",
          action === InsertAction.insert,
        );
      }}
    />
  );
}

const variableControls = { Input: VarInput, Insert: VariableInsert };

const updateHeaders: NonNullable<SystemHeaders["onChange"]> = (
  protocol,
  headers,
) => {
  const key =
    protocol === "websocket"
      ? "systemRequestHeaderWebSocket"
      : "systemRequestHeader";
  const { systemConfig, updateSystemConfig } = useSystemConfig.getState();
  updateSystemConfig({ ...systemConfig, [key]: headers });
  window.vscode.postMessage({
    action: "setSystemConfig",
    data: { [key]: headers },
  });
};

// Application composition owns store subscriptions and business implementations.
// Shared components consume only the narrow contracts declared in shared/contexts.
export default function SharedComponentsProvider({
  children,
}: {
  children: ReactNode;
}) {
  const theme = useGlobal((state) => state.vscodeTheme);
  const { fontSize, fontFamily, lightJsonTheme, http, websocket } =
    useSystemConfig(
      useShallow(({ systemConfig: config }) => ({
        fontSize: typeof config.font_size === "number" ? config.font_size : 14,
        fontFamily: config.font_family || "monospace",
        lightJsonTheme: ["white", "orange"].includes(config.bg_color),
        http: config.systemRequestHeader,
        websocket: config.systemRequestHeaderWebSocket,
      })),
    );
  const preferences = useMemo(
    () => ({
      theme: theme || "",
      fontSize,
      fontFamily,
      lightJsonTheme,
      resolveVariable: getEditorVariable,
    }),
    [theme, fontSize, fontFamily, lightJsonTheme],
  );
  const headers = useMemo(
    () => ({
      http: http || [],
      websocket: websocket || [],
      onChange: updateHeaders,
    }),
    [http, websocket],
  );

  return (
    <EditorPreferencesContext.Provider value={preferences}>
      <VariableControlsContext.Provider value={variableControls}>
        <SystemHeadersContext.Provider value={headers}>
          {children}
        </SystemHeadersContext.Provider>
      </VariableControlsContext.Provider>
    </EditorPreferencesContext.Provider>
  );
}
