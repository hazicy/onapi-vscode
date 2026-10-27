import * as vscode from "vscode";
import { DEFAULT_PROJECT } from "@onapi/http-model/project/constants/project";
import { DEFAULT_TEAM } from "@onapi/http-model/project/constants/team";
import { Project, TeamItem } from "@onapi/http-model/auth/types/index";

export const getUserConfig = (
  context: vscode.ExtensionContext,
): { currentTeam: TeamItem; currentProject: Project } => {
  try {
    let user_config: any = context.globalState.get("userConfig") || {};
    return {
      ...{
        currentTeam: DEFAULT_TEAM,
        currentProject: DEFAULT_PROJECT,
      },
      ...user_config,
    };
  } catch (error) {}
  return {
    currentTeam: DEFAULT_TEAM,
    currentProject: DEFAULT_PROJECT,
  };
};
