import { useEffect, useState } from "react";
import CodeEditor from "@/shared/components/CodeEditor/CodeEditor";
import PublicParamsTable from "@/shared/components/RequestTable/components/PublicParamsTable";
import RowValue from "@/shared/components/RequestTable/components/RowValue";
import {
  VariableControlsContext,
  type VariableInsertProps,
  type VariableInputProps,
} from "@/shared/contexts/variable-controls";
import useSystemConfig from "@/features/settings/store/useSystemConfig";
import { useGlobal } from "@/app/store";
import type { ApisBaseDataItem } from "@onapi/domain/requests/types/base";
import { App, modal } from "@/shared/ui/base";
import LayoutControl from "@/shared/components/ResizablePanels/LayoutControl";
import ResizablePanels from "@/shared/components/ResizablePanels/ResizablePanels";

function TestInput({ value, onChange, suffix }: VariableInputProps) {
  return (
    <div style={{ display: "flex", alignItems: "center" }}>
      <input
        aria-label="Injected input"
        value={value}
        onChange={(event) => onChange?.(event.target.value)}
      />
      {suffix}
    </div>
  );
}

function TestInsert({ onChange, children }: VariableInsertProps) {
  return (
    <div style={{ display: "inline-flex", alignItems: "center" }}>
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
        <section aria-label="Inherited headers">
          <PublicParamsTable
            tabType="header"
            globalParams={[
              {
                param_id: "collection-header",
                description: "",
                field_type: "String",
                not_null: -1,
                key: "X-Collection",
                value: "shared",
                is_checked: 1,
              },
            ]}
            folderParams={[{ key: "X-Folder", value: "folder", is_checked: 1 }]}
          />
        </section>
        <output aria-label="Configuration">{JSON.stringify(config)}</output>
        <output aria-label="Messages">{JSON.stringify(messages)}</output>
        <VariableControlsContext.Provider
          value={{
            Input: TestInput,
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
        <LayoutControl />
        <button
          onClick={() => {
            const { systemConfig, updateSystemConfig } =
              useSystemConfig.getState();
            updateSystemConfig({ ...systemConfig, tab_direction: -1 });
          }}
        >
          Receive horizontal layout
        </button>
        <section
          aria-label="Preferred panel layout"
          style={{ width: 800, height: 400 }}
        >
          <ResizablePanels
            showDirectionBtn
            leftPanel={<div>Preferred request panel</div>}
            rightPanel={<div>Preferred response panel</div>}
          />
        </section>
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
