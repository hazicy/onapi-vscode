import { useGlobal } from "@/app/store";
import useApis from "@/features/requests/store/useApis";

export function beginRequest(): boolean {
  const { currentSendingData, updateCurrentSendingData } = useApis.getState();
  if (currentSendingData?.sendStatus === "sending") {
    return false;
  }
  updateCurrentSendingData({
    ...currentSendingData,
    sendStatus: "sending",
    error: null,
    message: undefined,
  });
  return true;
}

export function cancelRequest(): void {
  const { currentSendingData, updateCurrentSendingData } = useApis.getState();
  updateCurrentSendingData({ ...currentSendingData, sendStatus: "initial" });
  window.vscode.postMessage({ action: "stopSendApi" });
  useGlobal.getState().cancelToken?.();
}
