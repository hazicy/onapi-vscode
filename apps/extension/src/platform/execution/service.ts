import { ExecutionService } from "@onapi/core";

/** Shared execution boundary. Protocol adapters never receive a Webview. */
export const executionService = new ExecutionService();
