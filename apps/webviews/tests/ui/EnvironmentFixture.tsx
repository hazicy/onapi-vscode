import { useState } from "react";
import Environment from "@/features/environment/components/Environment";
import useProjectConfig from "@/features/project/store/useProjectConfig";

const initial = useProjectConfig.getState().http;
useProjectConfig.getState().updateProjectConfig({
  envSettingKeys: "globalParm",
  http: {
    ...initial,
    collection: {
      ...initial.collection,
      variable: [{ key: "base_url", value: "https://example.test" }],
    },
  },
});

export default function EnvironmentFixture() {
  const [width, setWidth] = useState(1000);
  window.vscode = {
    postMessage: (message: unknown) => {
      (window as any).environmentMessages ||= [];
      (window as any).environmentMessages.push(message);
    },
  } as typeof window.vscode;
  return (
    <>
      <button onClick={() => setWidth(420)}>Narrow panel</button>
      <button onClick={() => setWidth(1000)}>Wide panel</button>
      <section
        aria-label="Environment workspace"
        style={{ width, height: 650, fontFamily: "sans-serif" }}
      >
        <Environment open />
      </section>
    </>
  );
}
