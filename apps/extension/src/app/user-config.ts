import * as vscode from "vscode";
import { DEFAULT_PROJECT } from "@onapi/domain/project/constants/project";
import { DEFAULT_TEAM } from "@onapi/domain/project/constants/team";
import type {
  Workspace,
  WorkspaceGroup,
} from "@onapi/domain/project/types/workspace";

export const getUserConfig = (
  context: vscode.ExtensionContext,
): { currentTeam: WorkspaceGroup; currentProject: Workspace } => {
  try {
    const userConfig = context.globalState.get<{
      currentTeam?: WorkspaceGroup;
      currentProject?: Workspace;
    }>("userConfig");
    return {
      currentTeam: userConfig?.currentTeam ?? DEFAULT_TEAM,
      currentProject: userConfig?.currentProject ?? DEFAULT_PROJECT,
    };
  } catch (error) {}
  return {
    currentTeam: DEFAULT_TEAM,
    currentProject: DEFAULT_PROJECT,
  };
};
