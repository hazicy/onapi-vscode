import type { EditorRecord } from "@onapi/domain/requests/record";
import type * as vscode from "vscode";
import { requestDefinition } from "@onapi/domain";
import { snowflakeId } from "@onapi/domain/utils/data-tools";
import { cloneDeep } from "lodash-es";
import { readStoredData, updateStoredData } from "../../platform/storage";
import { getApiListName } from "./request-storage";

type HistoricalRequest = Pick<EditorRecord, "id" | "name" | "parentId"> & {
  kind: string;
  url?: string;
  method?: string;
  request?: unknown;
};

export interface RequestHistoryEntry {
  id: string;
  sentAt: number;
  request: HistoricalRequest;
}

const HISTORY_LIMIT = 200;

export function getRequestHistory(
  context: vscode.ExtensionContext,
): RequestHistoryEntry[] {
  const data = readStoredData(
    context,
    `${getApiListName(context)}:history`,
    [],
  );
  return Array.isArray(data) ? data : [];
}

// Keep request definitions, without response bodies, scoped to the active workspace.
export async function recordRequestHistory(
  context: vscode.ExtensionContext,
  data: HistoricalRequest,
) {
  if (!data?.id || !data.kind) {
    return;
  }
  const { response: _response, ...request } = requestDefinition(
    cloneDeep(data as HistoricalRequest & { response?: unknown }),
  );
  const entry: RequestHistoryEntry = {
    id: snowflakeId(),
    sentAt: Date.now(),
    request,
  };
  return updateStoredData(
    context,
    `${getApiListName(context)}:history`,
    (entries) => [entry, ...entries].slice(0, HISTORY_LIMIT),
  );
}
