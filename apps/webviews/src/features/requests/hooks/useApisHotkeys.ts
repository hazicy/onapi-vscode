import { sendRequestPanelMessage } from "@/shared/bridge/request-panel";
import { beginRequest } from "@/features/requests/utils/requestExecution";
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
      const { apisActiveData } = useApis.getState();
      if (action === APIS_HOT_KEYS_ENUM.SEND) {
        const kind = apisActiveData.kind;
        if (kind !== "api" && kind !== "graphql") {
          return;
        }
        const executionId = beginRequest();
        if (!executionId) {
          return;
        }
        sendRequestPanelMessage({
          action: "sendApi",
          executionId,
          data: { ...apisActiveData, kind, request: apisActiveData.request },
        });
      } else {
        sendRequestPanelMessage({
          action: "saveApiData",
          data: apisActiveData,
        });
      }
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
