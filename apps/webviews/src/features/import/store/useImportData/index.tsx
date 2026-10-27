import type { HttpProjectConfig } from "@onapi/http-model";
import { create } from "@/shared/state/store";
import { ApiDetailsData } from "@onapi/http-model/requests/types/api";
import { EnvList } from "@onapi/http-model/environment/types/index";
import { IDataModel } from "@/features/schemas/types";

type State = {
  previewData: {
    http?: HttpProjectConfig;
    apis: ApiDetailsData[];
    models: IDataModel[];
    envs: EnvList;
  };
  previewSelectData: {
    apis: string[];
    models: string[];
    envs: string[];
    apiHalfs?: string[];
    modelHalfs?: string[];
  };
  preview: boolean;
  previewLoading: boolean;
};

type Action = {
  updatePreviewData: (previewData: State["previewData"]) => void;
  updatePreviewSelectData: (
    previewSelectData: State["previewSelectData"],
  ) => void;

  updatePreview: (preview: State["preview"]) => void;
  updatePreviewLoading: (previewLoading: State["previewLoading"]) => void;
};

const useImportData = create<State & Action>()((set) => ({
  previewData: {
    apis: [],
    models: [],
    envs: [],
  },
  previewSelectData: {
    apis: [],
    models: [],
    envs: [],
  },
  preview: false,
  previewLoading: false,

  updatePreviewData: (previewData) => set(() => ({ previewData })),
  updatePreviewSelectData: (previewSelectData) =>
    set(() => ({ previewSelectData })),
  updatePreview: (preview) => set(() => ({ preview })),
  updatePreviewLoading: (previewLoading) => set(() => ({ previewLoading })),
}));

export default useImportData;
