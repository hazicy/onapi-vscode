import { sendRequestPanelMessage } from "@/shared/bridge/request-panel";
import useProjectConfig from "@/features/project/store/useProjectConfig";

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
  return sendRequestPanelMessage({
    action: "setProjectConfig",
    data: { key, value },
  });
};

export const openEnvPage = (data?: any) => {
  sendRequestPanelMessage({
    action: "openEnv",
    data,
  });
};

export const getProjectConfig = () => {
  sendRequestPanelMessage({
    action: "getProjectConfig",
  });
};
