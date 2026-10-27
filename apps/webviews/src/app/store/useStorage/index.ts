import { get as _get } from "lodash";
import { createJSONStorage, persist } from "zustand/middleware";

import { create } from "@/app/store/utils";

type State = {
  oauthRefreshData: {
    [uid: string]: {
      [clientId: string]: {
        [key: string]: any;
      };
    };
  };
};

type Action = {
  updateOauthRefreshData: (p: State["oauthRefreshData"]) => void;
  getOauthRefreshData: (path: string[]) => string;
};

const useStorage = create<State & Action>()(
  persist(
    (set, get) => ({
      oauthRefreshData: {},
      updateOauthRefreshData: (oauthRefreshData: State["oauthRefreshData"]) =>
        set(() => ({ oauthRefreshData })),
      getOauthRefreshData: (path) => {
        const oauthRefreshData = get().oauthRefreshData;
        return _get(oauthRefreshData, path);
      },
    }),
    {
      name: "APP_STORAGE_DATA",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ oauthRefreshData: state.oauthRefreshData }),
    },
  ),
);

export default useStorage;
