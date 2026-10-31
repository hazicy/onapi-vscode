import QuoteOption from "@/features/variables/components/VarInsertPop/components/QuoteOption";
import CodeEditor from "@/shared/components/CodeEditor/CodeEditor";
import { useState } from "react";
import VarInput from "@/features/variables/components/VarInput/VarInput";
import useProjectConfig from "@/features/project/store/useProjectConfig";

const state = useProjectConfig.getState();
state.updateHttpGlobals([
  {
    key: "host",
    value: "https://global.example",
    description: "Not the value",
  },
  { key: "zero", value: 0 },
  { key: "plainZero", value: 0 },
  { key: "empty", value: "" },
  { key: "baseUrl", value: "https://base.example" },
  { key: "basePath", value: "/api" },
]);
state.updateHttpEnvironments([
  {
    id: "first",
    name: "First",
    values: [{ key: "host", value: "https://first.example" }],
  },
  {
    id: "second",
    name: "Second",
    values: [{ key: "host", value: "https://second.example" }],
  },
]);
state.setActiveHttpEnvironment("first");
state.updateProjectConfig({
  http: {
    ...useProjectConfig.getState().http,
    collection: {
      ...useProjectConfig.getState().http.collection,
      variable: [
        { key: "collectionOnly", value: "collection value" },
        { key: "host", value: "https://collection.example" },
        { key: "zero", value: "collection zero" },
        { key: "disabled", value: "hidden", disabled: true },
      ],
    },
  },
});

export default function VariableInputFixture() {
  const [value, setValue] = useState("{{host}}/{{zero}}/{{empty}}/{{missing}}");
  const multiline = new URLSearchParams(location.search).has("multiline");
  return (
    <main style={{ padding: 24, width: 320, fontSize: 13, lineHeight: "20px" }}>
      <div style={{ height: multiline ? 80 : 32 }}>
        <VarInput
          value={value}
          onChange={setValue}
          multiline={multiline}
          placeholder="Request value"
        />
      </div>
      {new URLSearchParams(location.search).has("code") && (
        <CodeEditor
          value={'{"host":"{{host}}"}'}
          language="json"
          options={{ hover: { enabled: true, delay: 0 } }}
        />
      )}
      {new URLSearchParams(location.search).has("quote") && (
        <QuoteOption value="" onChange={(name) => setValue(`{{${name}}}`)} />
      )}
      <button
        onClick={() =>
          useProjectConfig.getState().setActiveHttpEnvironment("second")
        }
      >
        Switch environment
      </button>
      <output aria-label="Raw value">{value}</output>
    </main>
  );
}
