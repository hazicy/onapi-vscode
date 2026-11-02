import { useState } from "react";
import Environment from "@/features/environment/components/Environment";
import useProjectConfig from "@/features/project/store/useProjectConfig";

const draftMode = new URLSearchParams(location.search).has("draft");
function initializeFixture() {
  const initial = useProjectConfig.getState().http;
  useProjectConfig.getState().updateProjectConfig({
    envSettingKeys: draftMode ? "draft-dev" : "globalParm",
    http: {
      ...initial,
      ...(draftMode
        ? {
            activeEnvironment: "draft-dev",
            environments: [
              {
                id: "draft-dev",
                name: "Review Development",
                values: [{ key: "token", value: "original-token" }],
              },
              { id: "draft-prod", name: "Review Production", values: [] },
            ],
          }
        : {}),
      collection: {
        ...initial.collection,
        variable: [{ key: "base_url", value: "https://example.test" }],
      },
    },
  });
}

export default function EnvironmentFixture() {
  const [width, setWidth] = useState(() => {
    initializeFixture();
    return 1000;
  });
  window.vscode = {
    postMessage: (message: unknown) => {
      (window as any).environmentMessages ||= [];
      (window as any).environmentMessages.push(message);
    },
  } as typeof window.vscode;
  return (
    <>
      {draftMode && (
        <button
          onClick={() => {
            const state = useProjectConfig.getState();
            state.updateProjectConfig({
              http: {
                ...structuredClone(state.http),
                activeEnvironment: "draft-prod",
              },
            });
          }}
        >
          Simulate environment switch
        </button>
      )}
      {draftMode && (
        <button
          onClick={() => {
            const state = useProjectConfig.getState();
            const http = structuredClone(state.http);
            http.environments[0].name = "Host renamed environment";
            http.environments[0].values![0].value = "host-token";
            state.updateProjectConfig({ http });
          }}
        >
          Simulate host update
        </button>
      )}
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
