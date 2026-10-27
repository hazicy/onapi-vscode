import { get, post } from "./utils";

/**
 * Get environment list
 */
export const getEnvListService = (data: { project_id: string }) => {
  return get({ url: "/ide/vscode/project/env/list", data });
};

/**
 * Get service list
 */
export const getServiceList = (data: { project_id: string }) => {
  return get({ url: "/ide/vscode/project/env/server/list", data });
};

/**
 * Get project global variables
 */
export const getProjectGlobalVarService = (data: { project_id: string }) => {
  return get({ url: "/ide/vscode/project/global/var/list", data });
};

/**
 * Get project global parameters
 */
export const getProjectGlobalParamService = (data: { project_id: string }) => {
  return get({ url: "/ide/vscode/project/global/param/details", data });
};

/**
 * Add new environment
 */
export const addProjectEnvService = (data: any) =>
  post({ url: "/ide/vscode/project/env/add", data });

/**
 * Update environment info
 */
export const updateProjectEnvService = (data: any) =>
  post({ url: "/ide/vscode/project/env/up", data });

/**
 * Add new service
 */
export const addProjectEnvSeverService = (data: any) =>
  post({ url: "/ide/vscode/project/env/server/add", data });

/**
 * Update service info
 */
export const updateProjectEnvSeverService = (data: any) =>
  post({ url: "/ide/vscode/project/env/server/up", data });
