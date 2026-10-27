import type * as vscode from "vscode";
import { requestDefinition } from "@onapi/http-model";
import { snowflakeId } from "@onapi/http-model/utils/data-tools";
import { cloneDeep } from "lodash";
import {
  getDataFromGlobalStorage,
  updateDataInGlobalStorage,
} from "../../platform/storage";
import { getApiListName } from "./request-storage";
import type { ApiDetailsData } from "@onapi/http-model/requests/types/api";

type HistoricalRequest = Pick<ApiDetailsData, "id" | "name" | "parentId"> & {
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
  const data = getDataFromGlobalStorage(
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
  return updateDataInGlobalStorage(
    context,
    `${getApiListName(context)}:history`,
    (entries) => [entry, ...entries].slice(0, HISTORY_LIMIT),
  );
}
