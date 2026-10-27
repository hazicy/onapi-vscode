import { reduceHttpExecutionEvent } from "@/features/requests/execution/http-state";
import useApis from "@/features/requests/store/useApis";

export function beginRequest(): string | undefined {
  const { currentSendingData, updateCurrentSendingData } = useApis.getState();
  if (currentSendingData?.status === "sending") {
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
    currentSendingData?.status !== "sending" ||
    !currentSendingData.executionId
  ) {
    return;
  }
  updateCurrentSendingData(
    reduceHttpExecutionEvent(currentSendingData, {
      type: "cancel",
      executionId: currentSendingData.executionId,
    }),
  );
  window.vscode.postMessage({
    action: "stopSendApi",
    executionId: currentSendingData.executionId,
  });
}
