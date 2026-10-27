import { create } from "zustand";

import { devtools } from "@/shared/state/store";
import {
  AutoImportItem,
  ConnectToDatabaseItem,
  CustomAttributeItem,
  DescriptionItem,
  MarkItem,
  MockInfo,
  MockItem,
  FunctionItem,
} from "@onapi/http-model/project/types/index";

type State = {
  markList: MarkItem[]; // interface status list
  customAttributeList: CustomAttributeItem[]; // custom attribute list
  innerDescriptionList: DescriptionItem[]; // built-in description list
  descriptionList: DescriptionItem[]; // custom description list
  mockInfo: MockInfo; // mock settings
  mockInnerList: MockItem[]; // built-in mock list
  mockList: MockItem[]; // custom mock list
  syncList: Array<
    AutoImportItem & { auto_import_id: string; project_id: string }
  >; // sync import project list
  connectDatabaseList: ConnectToDatabaseItem[]; // database connection list
  tags: string[];
  functionList: FunctionItem[];
};

type Action = {
  updateMarkList: (config: MarkItem[]) => void;
  updateCustomAttributeList: (config: CustomAttributeItem[]) => void;
  updateDescriptionInnerList: (config: DescriptionItem[]) => void;
  updateDescriptionList: (config: DescriptionItem[]) => void;
  updateMockInfo: (config: MockInfo) => void;
  updateMockInnerList: (config: MockItem[]) => void;
  updateMockList: (config: MockItem[]) => void;
  updateSyncList: (
    config: Array<
      AutoImportItem & { auto_import_id: string; project_id: string }
    >,
  ) => void;
  updateConnectDatabaseList: (config: ConnectToDatabaseItem[]) => void;
  updateTags: (config: string[]) => void;
  updateFunctionList: (config: FunctionItem[]) => void;
};

const useProjectSetting = create<State & Action>()(
  devtools(
    (set) => ({
      markList: [],
      customAttributeList: [],
      descriptionList: [],
      innerDescriptionList: [],
      mockInfo: {} as MockInfo,
      mockInnerList: [],
      mockList: [],
      syncList: [],
      connectDatabaseList: [],
      tags: [],
      functionList: [],

      updateMarkList: (params) => set({ markList: params }),
      updateCustomAttributeList: (params) =>
        set({ customAttributeList: params }),
      updateDescriptionInnerList: (params) =>
        set({ innerDescriptionList: params }),
      updateDescriptionList: (params) => set({ descriptionList: params }),
      updateMockInfo: (params) => set({ mockInfo: params }),
      updateMockInnerList: (params) => set({ mockInnerList: params }),
      updateMockList: (params) => set({ mockList: params }),
      updateSyncList: (params) => set({ syncList: params }),
      updateConnectDatabaseList: (params) =>
        set({ connectDatabaseList: params }),
      updateTags: (params) => set({ tags: params }),
      updateFunctionList: (params) => set({ functionList: params }),
    }),
    { name: "useProjectSetting" },
  ),
);

export default useProjectSetting;
