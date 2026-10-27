import { DocPageData, ShareInfoData } from "@onapi/domain/sharing/types/share";
import { create } from "zustand";

type State = {
  shareData: { [x: string]: ShareInfoData };
  docPageData: DocPageData;
  docBaseUrl: string;
};

type Action = {
  updateShareData: (p: State["shareData"]) => void;
  updateDocPageData: (p: State["docPageData"]) => void;
  updateDocBaseUrl: (p: State["docBaseUrl"]) => void;
};

export default create<State & Action>()((set) => ({
  shareData: {},
  docBaseUrl: "",
  docPageData: {
    net_url: "",
    fileName: "",
    openApiStr: "",
  },
  updateShareData: (shareData) => set(() => ({ shareData })),
  updateDocPageData: (docPageData) => set(() => ({ docPageData })),
  updateDocBaseUrl: (docBaseUrl) => set(() => ({ docBaseUrl })),
}));
