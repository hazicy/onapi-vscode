import { useHotkeys } from "react-hotkeys-hook";
import {
  APIS_HOT_KEYS_ENUM,
  DEFAULT_APIS_HOT_KEYS_MAP,
  DEFAULT_HOT_KEYS_OPTIONS,
  SYSTEM_HOT_KEYS_SCOPES_ENUM,
} from "@/shared/constants/hotkeys";
import useApis from "@/features/requests/store/useApis";
import { handleHotKeysEventAction } from "@/shared/utils/hotkeys";

const shortcuts = Object.values(DEFAULT_APIS_HOT_KEYS_MAP).flat();

export default function useApisHotkeys() {
  useHotkeys(
    shortcuts,
    (_event, hotkey) => {
      const action = handleHotKeysEventAction(
        hotkey,
        DEFAULT_APIS_HOT_KEYS_MAP,
      );
      if (
        action !== APIS_HOT_KEYS_ENUM.SEND &&
        action !== APIS_HOT_KEYS_ENUM.SAVE
      ) {
        return;
      }
      const { apisActiveData, updateCurrentSendingData } = useApis.getState();
      if (action === APIS_HOT_KEYS_ENUM.SEND) {
        updateCurrentSendingData({ sendStatus: "sending" });
      }
      window.vscode.postMessage({
        action: action === APIS_HOT_KEYS_ENUM.SEND ? "sendApi" : "saveApiData",
        data: apisActiveData,
      });
    },
    {
      ...DEFAULT_HOT_KEYS_OPTIONS,
      scopes: [SYSTEM_HOT_KEYS_SCOPES_ENUM.APIS],
      // Reserve app shortcuts before editors consume Mod+Enter as a newline.
      eventListenerOptions: { capture: true },
      ignoreEventWhen: (event) => event.isComposing || event.repeat,
    },
  );
}
