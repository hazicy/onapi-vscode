import { createDefaultHttpConfig } from "@onapi/domain";
import {
  INIT_ENV_LIST,
  INIT_SERVER_LIST,
} from "@onapi/domain/project/constants/project";
import { create } from "@/shared/state/store";
import { EnvList, ServerItem } from "@onapi/domain/environment/types/index";
import { SocketGlobalParams } from "@onapi/domain/project/types/index";

type State = {
  http: import("@onapi/domain").HttpProjectConfig;
  globalParams: Partial<SocketGlobalParams>;
  globalParamsTabKey: string;
  /** Socket environment/server settings; HTTP scopes live only in http. */
  envList: EnvList;
  envOpen: boolean;
  envSettingKeys: string;
  establish: boolean;
  envDetailKeys: string;
  tags: string[];
  serverList: ServerItem[];
  customMethodList: string[]; // custom method collection
};

type Action = {
  updateHttpGlobals: (
    p: import("postman-collection").VariableDefinition[],
  ) => void;
  updateGlobalParams: (p: State["globalParams"]) => void;
  updateGlobalParamsTabKey: (p: State["globalParamsTabKey"]) => void;
  updateHttpEnvironments: (
    p: import("@onapi/domain").EnvironmentScope[],
  ) => void;
  updateServerList: (p: State["serverList"]) => void;
  updateEnvOpen: (p: State["envOpen"]) => void;
  updateEnvSettingKeys: (p: State["envSettingKeys"]) => void;
  updateEstablish: (p: State["establish"]) => void;
  setActiveHttpEnvironment: (id: string) => void;
  updateTags: (p: State["tags"]) => void;
  updateProjectConfig: (p: Partial<State>) => void;
  updateCustomMethodList: (config: string[]) => void;
};

export default create<State & Action>()((set) => ({
  http: createDefaultHttpConfig(),
  globalParams: {},
  envList: INIT_ENV_LIST,
  serverList: INIT_SERVER_LIST,
  envOpen: false,
  envSettingKeys: "",
  establish: false,
  envDetailKeys: "",
  tags: [],
  globalParamsTabKey: "Headers",
  customMethodList: [],
  updateHttpGlobals: (payload) =>
    set((state) => ({
      http: {
        ...state.http!,
        options: {
          ...state.http!.options,
          globals: { ...state.http!.options.globals, values: payload },
        },
      },
    })),
  updateHttpEnvironments: (payload) =>
    set((state) => ({ http: { ...state.http!, environments: payload } })),
  updateEnvOpen: (payload) => set((state) => ({ ...state, envOpen: payload })),
  updateEnvSettingKeys: (payload) =>
    set((state) => ({ ...state, envSettingKeys: payload })),
  updateEstablish: (payload) =>
    set((state) => ({ ...state, establish: payload })),
  setActiveHttpEnvironment: (id) =>
    set((state) => ({ http: { ...state.http, activeEnvironment: id } })),
  updateGlobalParams: (payload) =>
    set((state) => ({ ...state, globalParams: payload })),
  updateGlobalParamsTabKey: (payload) =>
    set((state) => ({ ...state, globalParamsTabKey: payload })),
  updateTags: (payload) => set((state) => ({ ...state, tags: payload })),
  updateProjectConfig: (payload) => set((state) => ({ ...state, ...payload })),
  updateServerList: (payload) =>
    set((state) => ({ ...state, serverList: payload })),
  updateCustomMethodList: (payload) =>
    set((state) => ({ ...state, customMethodList: payload })),
}));
