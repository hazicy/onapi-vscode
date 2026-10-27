import {
  requestPanelCommandSchema,
  type RequestPanelCommand,
  type RequestPanelResponseInput,
} from "@onapi/contracts/request-panel";

export function parseRequestPanelCommand(value: unknown): RequestPanelCommand {
  return requestPanelCommandSchema.parse(value);
}

export async function receiveRequestPanelCommand(
  value: unknown,
  handle: (message: RequestPanelCommand) => Promise<unknown>,
  fail: (error: Error) => Promise<unknown>,
): Promise<void> {
  const result = requestPanelCommandSchema.safeParse(value);
  if (!result.success) {
    await fail(
      new Error(
        result.error.issues
          .map(
            (issue) => `${issue.path.join(".") || "message"}: ${issue.message}`,
          )
          .join("; "),
      ),
    );
    return;
  }
  try {
    await handle(result.data);
  } catch (error) {
    await fail(error instanceof Error ? error : new Error(String(error)));
  }
}

/** Transport only: no host, browser, state store or feature dependencies. */
export function postRequestPanelResponse(
  target: { postMessage(message: RequestPanelResponseInput): unknown },
  message: RequestPanelResponseInput,
): unknown {
  return target.postMessage(message);
}
