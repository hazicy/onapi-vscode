import { sendRequestPanelMessage } from "@/shared/bridge/request-panel";
export const openUrl = (url: string, target = "_blank") => {
  sendRequestPanelMessage({
    action: "openNewWindow",
    data: url,
  });
};
