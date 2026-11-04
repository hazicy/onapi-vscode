import { cloneDeep } from "lodash-es";
import * as vscode from "vscode";
import {
  hasStoredData,
  readStoredData,
  writeStoredData,
  updateStoredData,
} from "./index";
import type { ProjectConfigType } from "@onapi/domain/project/types/index";
import { DEFAULT_PROJECT_CONFIG } from "@onapi/domain/project/constants/project";
import { globalConfig } from "../../app/config";

export interface ProjectWorkspace {
  projectId: string;
  userId: string | number;
}

export const getProjectWorkspace = (
  context: vscode.ExtensionContext,
): ProjectWorkspace => {
  const config = context.globalState.get<{
    currentProject?: { project_id: string };
    userInfo?: { uid: string | number };
  }>("userConfig");
  return {
    projectId: config?.currentProject?.project_id || "-1",
    userId: config?.userInfo?.uid || -1,
  };
};

const projectConfigKey = ({ projectId, userId }: ProjectWorkspace) =>
  projectId === "-1"
    ? "projectConfig_-1_-1"
    : `projectConfig_${userId}_${projectId}`;

export const getCurrentProjectConfig = (context: vscode.ExtensionContext) =>
  getProjectConfig(context, getProjectWorkspace(context));

export const getProjectConfig = (
  context: vscode.ExtensionContext,
  workspace: ProjectWorkspace,
): ProjectConfigType => {
  const key = projectConfigKey(workspace);
  if (hasStoredData(context, key)) {
    return readStoredData(context, key);
  }
  const config = cloneDeep(DEFAULT_PROJECT_CONFIG);
  return config;
};

export const getCurrentProjectId = (context: vscode.ExtensionContext) => {
  try {
    let user_config: any = context.globalState.get("userConfig") || {};
    if (
      user_config?.currentProject &&
      user_config?.currentProject?.project_id !== "-1"
    ) {
      return user_config?.currentProject?.project_id;
    } else {
      return "-1";
    }
  } catch (error) {
    return "-1";
  }
};

export const setProjectConfig = (
  context: vscode.ExtensionContext,
  config: any,
) => saveProjectConfig(context, getProjectWorkspace(context), config);

export const saveProjectConfig = async (
  context: vscode.ExtensionContext,
  workspace: ProjectWorkspace,
  new_project_config: any,
) => {
  try {
    const projectConfigFileName = projectConfigKey(workspace);
    if (
      !(await writeStoredData(
        context,
        projectConfigFileName,
        new_project_config,
      ))
    ) {
      return false;
    }
    notifyProjectConfig(context, workspace);
    return true;
  } catch (error) {
    return false;
  }
};

/** Apply a targeted change against the latest snapshot under the repository lock. */
export const updateProjectConfig = async (
  context: vscode.ExtensionContext,
  workspace: ProjectWorkspace,
  change: (config: ProjectConfigType) => ProjectConfigType,
) => {
  const saved = await updateStoredData(
    context,
    projectConfigKey(workspace),
    (current) =>
      change(
        Object.keys(current).length
          ? current
          : cloneDeep(DEFAULT_PROJECT_CONFIG),
      ),
  );
  if (!saved) {
    return false;
  }
  notifyProjectConfig(context, workspace);
  return true;
};

function notifyProjectConfig(
  context: vscode.ExtensionContext,
  workspace: ProjectWorkspace,
) {
  if (
    projectConfigKey(workspace) !==
    projectConfigKey(getProjectWorkspace(context))
  ) {
    return;
  }
  const config = getProjectConfig(context, workspace);
  for (const panel of [
    ...Object.values(globalConfig.openedPanels || {}),
    globalConfig.environmentWebView,
  ]) {
    panel?.webview.postMessage({ action: "setProjectConfig", data: config });
  }
}
