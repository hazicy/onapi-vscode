import { sendRequestPanelMessage } from "@/shared/bridge/request-panel";
import { reduceHttpExecutionEvent } from "@/features/requests/protocols/http/http-state";
import useRequestWorkspaceStore from "@/features/requests/store/useRequestWorkspaceStore";

export function beginRequest(): string | undefined {
  const { httpExecution, setHttpExecution } =
    useRequestWorkspaceStore.getState();
  if (httpExecution?.session?.status === "running") {
    return undefined;
  }
  const executionId = crypto.randomUUID();
  setHttpExecution(
    reduceHttpExecutionEvent(httpExecution, {
      type: "begin",
      executionId,
    }),
  );
  return executionId;
}

export function cancelRequest(): void {
  const { httpExecution, setHttpExecution } =
    useRequestWorkspaceStore.getState();
  if (
    httpExecution?.session?.status !== "running" ||
    !httpExecution.session.executionId
  ) {
    return;
  }
  setHttpExecution(
    reduceHttpExecutionEvent(httpExecution, {
      type: "cancel",
      executionId: httpExecution.session.executionId,
    }),
  );
  sendRequestPanelMessage({
    action: "stopSendApi",
    executionId: httpExecution.session.executionId,
  });
}
