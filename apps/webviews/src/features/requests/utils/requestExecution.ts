import { sendRequestPanelMessage } from "@/shared/bridge/request-panel";
import { reduceHttpExecutionEvent } from "@/features/requests/execution/http-state";
import useApis from "@/features/requests/store/useApis";

export function beginRequest(): string | undefined {
  const { currentSendingData, updateCurrentSendingData } = useApis.getState();
  if (currentSendingData?.session?.status === "running") {
    return undefined;
  }
  const executionId = crypto.randomUUID();
  updateCurrentSendingData(
    reduceHttpExecutionEvent(currentSendingData, {
      type: "begin",
      executionId,
    }),
  );
  return executionId;
}

export function cancelRequest(): void {
  const { currentSendingData, updateCurrentSendingData } = useApis.getState();
  if (
    currentSendingData?.session?.status !== "running" ||
    !currentSendingData.session.executionId
  ) {
    return;
  }
  updateCurrentSendingData(
    reduceHttpExecutionEvent(currentSendingData, {
      type: "cancel",
      executionId: currentSendingData.session.executionId,
    }),
  );
  sendRequestPanelMessage({
    action: "stopSendApi",
    executionId: currentSendingData.session.executionId,
  });
}
