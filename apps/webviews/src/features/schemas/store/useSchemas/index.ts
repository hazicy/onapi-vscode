import { create } from "@/app/store/utils";
import { IDataModel } from "@/features/schemas/types";

type State = {
  schemasBaseData: { [x: string]: any }; // model source data kv
  schemasOpenList: string[]; // open tab ids array
  schemasActiveKey: string;
  schemasLoading: boolean;
  schemasDetailLoading: boolean;

  schemasOpensData: { [k: string]: IDataModel }; // data model details kv
  schemasOpensStagingData: { [k: string]: IDataModel }; // data model staging details kv
  model_id?: any;
};

type Action = {
  updateSchemasBaseData: (schemasBaseData: State["schemasBaseData"]) => void;
  updateSchemasOpenList: (schemasOpenList: State["schemasOpenList"]) => void;
  updateSchemasActiveKey: (schemasActiveKey: string) => void;
  updateSchemasLoading: (schemasLoading: State["schemasLoading"]) => void;
  updateSchemasDetailLoading: (
    schemasDetailLoading: State["schemasLoading"],
  ) => void;

  updateSchemasOpens: (p: any) => void;
};

const useSchemas = create<State & Action>()((set) => ({
  schemasBaseData: {},
  schemasOpenList: [],
  schemasActiveKey: "",
  schemasLoading: false,
  schemasDetailLoading: false,

  schemasOpensData: {},
  schemasOpensStagingData: {},

  updateSchemasBaseData: (schemasBaseData: State["schemasBaseData"]) =>
    set(() => ({ schemasBaseData })),
  updateSchemasOpenList: (schemasOpenList: State["schemasOpenList"]) =>
    set(() => ({ schemasOpenList })),
  updateSchemasActiveKey: (schemasActiveKey) =>
    set(() => ({ schemasActiveKey })),
  updateSchemasLoading: (schemasLoading) => set(() => ({ schemasLoading })),
  updateSchemasDetailLoading: (schemasDetailLoading) =>
    set(() => ({ schemasDetailLoading })),

  updateSchemasOpens: (payload) =>
    set((state) => ({
      ...state,
      schemasOpensData: payload?.schemasOpensData || state?.schemasOpensData,
      schemasOpensStagingData:
        payload?.schemasOpensStagingData || state?.schemasOpensStagingData,
      schemasOpenList: payload.schemasOpenList || state?.schemasOpenList,
    })),
}));

export default useSchemas;
