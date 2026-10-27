import { getEnvListService, getServiceList } from "@/features/sync/services/project";
import useProjectConfig from "@/features/project/store/useProjectConfig";
import type {
  EnvListItem,
  ServerItem,
} from "@onapi/domain/environment/types/index";
import type { Key } from "react";
import { cloneDeep } from "lodash-es";
import { compareEnvironments, mergeServiceLists } from "./environmentDiff";

type EnvironmentConflictList = ReturnType<typeof compareEnvironments> & {
  newServiceList: ServerItem[];
  cloudServiceList: ServerItem[];
};

export const getEnvConflictList = async (
  envCheckedKeys: Key[],
  project_id: string,
): Promise<EnvironmentConflictList> => {
  if (envCheckedKeys.length === 0) {
    return {
      addEnvs: [],
      diffEnvs: [],
      newServiceList: [],
      cloudServiceList: [],
    };
  }
  // Snapshot state before network requests so comparison never mutates the store.
  const { envList, serverList } = useProjectConfig.getState();
  const localServices = cloneDeep(serverList);
  const selected = new Set(envCheckedKeys);
  const localEnvironments = cloneDeep(
    envList.filter((environment) => selected.has(environment.env_id)),
  );
  const serviceList = await getServiceList({ project_id });
  const cloudEnvironments = await getEnvListService({ project_id });
  if (!Array.isArray(serviceList) || !Array.isArray(cloudEnvironments)) {
    throw new Error(
      "Unable to load environments and services for conflict checking.",
    );
  }
  return {
    ...compareEnvironments(localEnvironments, cloudEnvironments, project_id),
    newServiceList: mergeServiceLists(localServices, serviceList),
    cloudServiceList: serviceList,
  };
};

export const completeServiceList = (
  environment: EnvListItem,
  services: ServerItem[],
) => {
  environment.server_list ||= [];
  const ids = new Set(
    environment.server_list.map((service) => service.server_id),
  );
  for (const service of services) {
    if (!ids.has(service.server_id)) {
      environment.server_list.push(cloneDeep(service));
      ids.add(service.server_id);
    }
  }
};
