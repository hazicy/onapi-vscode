import type * as vscode from "vscode";
import type { ExecutionEvent } from "@onapi/contracts";
import { toPostmanCollection } from "@onapi/domain";
import { STATUS_CODE } from "@onapi/domain/constants/common";
import type { Settings } from "@onapi/domain/testing/types/common";
import type { EventItem } from "@onapi/domain/testing/types/index";
import { getApiList } from "../requests/request-storage";
import {
  getHttpProjectConfig,
  runCollection,
} from "../requests/execution/http-runner";
import { getFolderTestEvents } from "./folder-test-data";

/** Execute selected requests and forward native events unchanged. */
export async function runFolderTest(
  folderId: string,
  data: { settings: Settings; event_list: EventItem[] },
  context: vscode.ExtensionContext,
  panel: vscode.WebviewPanel,
) {
  const settings = data.settings;
  const selected = new Set(
    data.event_list
      .filter((event) => event.enabled === STATUS_CODE.ENABLE)
      .map((event) => event.event_id),
  );
  const allowed = getFolderTestEvents(folderId, context).filter((event) =>
    selected.has(event.event_id),
  );
  const http = getHttpProjectConfig(context);
  const collection = toPostmanCollection(
    getApiList(context),
    http.collection,
    new Set(allowed.map((event) => event.event_id)),
  );
  let completed = false;
  const emit = (event: ExecutionEvent) => {
    if (completed) {
      return;
    }
    if (event.type === "done") {
      completed = true;
    }
    panel.webview.postMessage({ action: "folderTestEvent", data: event });
  };
  panel.webview.postMessage({
    action: "folderTestStarted",
    data: {
      environmentName:
        http.environments.find(
          (env) => env.id === (settings.env_id || http.activeEnvironment),
        )?.name || "",
    },
  });
  try {
    if (!allowed.length) {
      throw new Error("No HTTP requests selected in this folder");
    }
    await runCollection(
      collection,
      {
        entrypoint: { execute: folderId, lookupStrategy: "idOrName" },
        iterationCount: settings.execute_count || 1,
        delay: { item: settings.interval_time || 0 },
        data: settings.iteration_data || [],
        sandbox: settings.enable_sandbox === STATUS_CODE.ENABLE,
        ...(settings.env_id
          ? {
              environment: http.environments.find(
                (env) => env.id === settings.env_id,
              ),
            }
          : {}),
      },
      context,
      (envelope) => {
        if ("native" in envelope.event) {
          emit(envelope.event.native);
        }
      },
      panel,
    );
    emit({ type: "done" });
  } catch (error) {
    emit({
      type: "done",
      error: {
        message: error instanceof Error ? error.message : String(error),
      },
    });
  }
}
