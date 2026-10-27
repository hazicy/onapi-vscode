import { EnvListItem } from "@onapi/domain/environment/types/index";

export type PushEnvData = {
  checkedKeys: React.Key[];
  conflictType: "local" | "cloud" | "mergeLocal" | "mergeCloud";
  conflictCheckedKeys: React.Key[];
  conflictItems: Array<{ localEnv: EnvListItem; cloudEnv: EnvListItem }>;
  addEnvs: any[];
  updateEnvs: any[];
  uploadItems: any[];
  newServiceList: any[];
  cloudServiceList: any[];
};

export type PushApiData = {
  checkedKeys: React.Key[];
  conflictType: "local" | "cloud";
  conflictCheckedKeys: React.Key[];
  conflictItems: any[];
};
