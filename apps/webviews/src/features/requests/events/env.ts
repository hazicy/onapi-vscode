import useProjectConfig from "@/features/project/store/useProjectConfig";

import { find } from "lodash-es";

export const saveEnvironments = (
  environments: import("@onapi/domain").EnvironmentScope[],
) => {
  const state = useProjectConfig.getState();
  state.updateHttpEnvironments(environments);
  if (
    !environments.some((scope) => scope.id === state.http.activeEnvironment)
  ) {
    state.setActiveHttpEnvironment(environments[0]?.id || "");
  }
  saveProjectConfig("http", useProjectConfig.getState().http);
};
export const copyEnv = async ({ id }: { id: string; project_id?: string }) => {
  const environments = useProjectConfig.getState().http!.environments;
  const scope = environments.find((item) => item.id === id);
  if (scope) {
    saveEnvironments([
      ...environments,
      {
        ...structuredClone(scope),
        id: crypto.randomUUID(),
        name: `${scope.name} copy`,
      },
    ]);
  }
};

export const saveProjectConfig = (key: any, value: any) => {
  window?.vscode.postMessage({
    action: "setProjectConfig",
    data: { key, value },
  });
};

export const openEnvPage = (data?: any) => {
  window?.vscode.postMessage({
    action: "openEnv",
    data,
  });
};

export const getProjectConfig = () => {
  window?.vscode.postMessage({
    action: "getProjectConfig",
  });
};
