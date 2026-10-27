import { useEffect, useState } from "react";
import CodeEditor from "@/shared/components/CodeEditor/CodeEditor";
import PublicParamsTable from "@/shared/components/RequestTable/components/PublicParamsTable";
import RowValue from "@/shared/components/RequestTable/components/RowValue";
import {
  VariableControlsContext,
  type VariableInsertProps,
} from "@/shared/contexts/variable-controls";
import useSystemConfig from "@/features/settings/store/useSystemConfig";
import { useGlobal } from "@/app/store";
import type { ApisBaseDataItem } from "@onapi/domain/requests/types/base";
import { App, modal } from "@/shared/ui/base";

function TestInsert({ onChange, children }: VariableInsertProps) {
  return (
    <div>
      {children}
      <button onClick={() => onChange("+", "value", true)}>Append value</button>
      <button onClick={() => onChange("replacement", "value", false)}>
        Replace value
      </button>
      <button onClick={() => onChange("+", "description", true)}>
        Append description
      </button>
      <button onClick={() => onChange("replacement", "description", false)}>
        Replace description
      </button>
    </div>
  );
}

export default function SharedComponentsFixture() {
  const [kind, setKind] = useState("api");
  const [messages, setMessages] = useState<unknown[]>([]);
  const [row, setRow] = useState<ApisBaseDataItem>({
    is_checked: 1,
    key: "token",
    value: "original",
    description: "description",
  });
  const config = useSystemConfig((state) => state.systemConfig);
  useEffect(() => {
    window.vscode = {
      postMessage: (message: unknown) =>
        setMessages((previous) => [...previous, message]),
    } as typeof window.vscode;
    const { systemConfig, updateSystemConfig } = useSystemConfig.getState();
    updateSystemConfig({
      ...systemConfig,
      systemRequestHeader: [
        { key: "X-HTTP", value: "http", is_checked: 1, field_type: "String" },
      ],
      systemRequestHeaderWebSocket: [
        {
          key: "X-Socket",
          value: "socket",
          is_checked: 1,
          field_type: "String",
        },
      ],
    });
  }, []);
  return (
    <App>
      <main>
        <button onClick={() => setKind(kind === "api" ? "websocket" : "api")}>
          Switch protocol
        </button>
        <section aria-label="Inherited headers">
          <PublicParamsTable kind={kind} tabType="header" />
        </section>
        <output aria-label="Configuration">{JSON.stringify(config)}</output>
        <output aria-label="Messages">{JSON.stringify(messages)}</output>
        <VariableControlsContext.Provider
          value={{
            Input: ({ value, onChange, suffix }) => (
              <div>
                <input
                  aria-label="Injected input"
                  value={value}
                  onChange={(event) => onChange?.(event.target.value)}
                />
                {suffix}
              </div>
            ),
            Insert: TestInsert,
          }}
        >
          <RowValue
            rowData={row}
            rowIndex={0}
            valueSuffix
            onChange={(_, next) => setRow(next)}
          />
        </VariableControlsContext.Provider>
        <output aria-label="Edited row">{JSON.stringify(row)}</output>
        <button
          onClick={() => {
            const { systemConfig, updateSystemConfig } =
              useSystemConfig.getState();
            updateSystemConfig({
              ...systemConfig,
              font_size: 19,
              font_family: "serif",
            });
            useGlobal.getState().updateVscodeTheme("Default Light Modern");
          }}
        >
          Change editor preferences
        </button>
        <div style={{ height: 100 }}>
          <CodeEditor value="unchanged" onMountAutoFormat={false} />
        </div>
        <button
          onClick={() =>
            modal.info({
              title: "Shared editor dialog",
              content: (
                <div style={{ height: 100 }}>
                  <CodeEditor
                    value="dialog content"
                    onMountAutoFormat={false}
                  />
                </div>
              ),
            })
          }
        >
          Open editor dialog
        </button>
      </main>
    </App>
  );
}
