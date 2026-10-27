import { cloneDeep } from "lodash-es";
import type {
  EnvListItem,
  ServerItem,
} from "@onapi/http-model/environment/types/index";

const indexServices = (services: ServerItem[]) => {
  const result = new Map<string, ServerItem>();
  for (const service of services) {
    const id = String(service.server_id);
    if (!result.has(id)) {
      result.set(id, service);
    }
  }
  return result;
};

export const mergeServiceLists = (
  local: ServerItem[],
  cloud: ServerItem[],
): ServerItem[] => {
  const localById = indexServices(local);
  const cloudById = indexServices(cloud);
  const merged = cloud.map((service) => {
    const saved = localById.get(String(service.server_id));
    if (!saved) {
      return cloneDeep(service);
    }
    return {
      ...cloneDeep(saved),
      ...(saved.name !== service.name ? { mode: "update" } : {}),
    };
  });
  for (const service of local) {
    if (!cloudById.has(String(service.server_id))) {
      merged.push({ ...cloneDeep(service), mode: "add" });
    }
  }
  return merged;
};

const environmentsDiffer = (
  local: EnvListItem,
  cloud: EnvListItem,
): boolean => {
  if (!["1", "2"].includes(cloud.env_id) && local.name !== cloud.name) {
    return true;
  }
  const localVariables = local.env_var_list || {};
  const cloudVariables = cloud.env_var_list || {};
  const cloudKeys = Object.keys(cloudVariables);
  if (
    Object.keys(localVariables).length !== cloudKeys.length ||
    cloudKeys.some(
      (key) =>
        !Object.prototype.hasOwnProperty.call(localVariables, key) ||
        localVariables[key]?.value !== cloudVariables[key]?.value ||
        localVariables[key]?.description !== cloudVariables[key]?.description,
    )
  ) {
    return true;
  }
  const localServices = local.server_list || [];
  const cloudServices = cloud.server_list || [];
  if (localServices.length !== cloudServices.length) {
    return true;
  }
  const localById = indexServices(localServices);
  return cloudServices.some((service) => {
    const saved = localById.get(String(service.server_id));
    return !saved || saved.name !== service.name || saved.uri !== service.uri;
  });
};

export const compareEnvironments = (
  local: EnvListItem[],
  cloud: EnvListItem[],
  projectId: string,
) => {
  const cloudById = new Map<string, EnvListItem>();
  for (const environment of cloud) {
    if (!cloudById.has(environment.env_id)) {
      cloudById.set(environment.env_id, environment);
    }
  }
  const addEnvs: EnvListItem[] = [];
  const diffEnvs: Array<{ localEnv: EnvListItem; cloudEnv: EnvListItem }> = [];
  for (const environment of local) {
    const saved = cloudById.get(environment.env_id);
    if (!saved) {
      addEnvs.push({ ...cloneDeep(environment), project_id: projectId });
    } else if (environmentsDiffer(environment, saved)) {
      diffEnvs.push({
        localEnv: cloneDeep(environment),
        cloudEnv: cloneDeep(saved),
      });
    }
  }
  return { addEnvs, diffEnvs };
};

export type EnvironmentConflictMode =
  | "local"
  | "cloud"
  | "mergeLocal"
  | "mergeCloud";
type EnvironmentConflict = { localEnv: EnvListItem; cloudEnv: EnvListItem };

const mergeEnvironment = (
  conflict: EnvironmentConflict,
  mode: EnvironmentConflictMode,
  services: ServerItem[],
): EnvListItem => {
  const local = cloneDeep(conflict.localEnv);
  const cloud = conflict.cloudEnv;
  const additions = mode === "local" ? services : cloud.server_list || [];
  local.server_list ||= [];
  const positions = new Map(
    local.server_list.map((service, index) => [
      String(service.server_id),
      index,
    ]),
  );
  for (const service of additions) {
    const id = String(service.server_id);
    const position = positions.get(id);
    if (position === undefined) {
      positions.set(id, local.server_list.length);
      local.server_list.push(cloneDeep(service));
    } else if (mode === "mergeCloud") {
      local.server_list[position] = cloneDeep(service);
    }
  }
  if (mode === "mergeCloud" || mode === "mergeLocal") {
    local.env_var_list = cloneDeep(
      mode === "mergeCloud"
        ? { ...local.env_var_list, ...cloud.env_var_list }
        : { ...cloud.env_var_list, ...local.env_var_list },
    );
    local.is_private = cloud.is_private;
    if (mode === "mergeCloud") {
      local.name = cloud.name;
    }
  }
  return local;
};

/** Resolve selected environments only; keep unresolved rows out of the upload queue. */
export const resolveEnvironmentConflicts = (
  conflicts: EnvironmentConflict[],
  selectedIds: string[],
  mode: EnvironmentConflictMode,
  services: ServerItem[],
  previousUploads: EnvListItem[],
) => {
  const selected = new Set(selectedIds);
  const uploads = new Map(
    previousUploads.map((environment) => [
      environment.env_id,
      cloneDeep(environment),
    ]),
  );
  const remaining: EnvironmentConflict[] = [];
  for (const conflict of conflicts) {
    const id = conflict.localEnv.env_id;
    if (!selected.has(id)) {
      remaining.push(conflict);
      continue;
    }
    if (mode === "cloud") {
      uploads.delete(id);
    } else {
      uploads.set(id, mergeEnvironment(conflict, mode, services));
    }
  }
  return { conflictItems: remaining, uploadItems: [...uploads.values()] };
};
