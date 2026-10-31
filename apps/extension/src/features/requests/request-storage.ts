import { cloneDeep } from "lodash";
import { requestDefinition } from "@onapi/domain";
import { editorRecordSchema } from "@onapi/domain/requests/record";
import { DEFAULT_TARGET_NAME } from "../../app/config";
import { getMaxSort } from "../collections/collection-order";

import { ApiDetailsData } from "@onapi/domain/requests/types/api";
import * as vscode from "vscode";
import {
  getDataFromGlobalStorage,
  setDataToGlobalStorage,
  updateDataInGlobalStorage,
} from "../../platform/storage/index";
export const getApiList = (
  context: vscode.ExtensionContext,
): ApiDetailsData[] => {
  return getDataFromGlobalStorage(context, getApiListName(context), []);
};

export const setApiList = (
  items: ApiDetailsData[],
  context: vscode.ExtensionContext,
) => setDataToGlobalStorage(context, getApiListName(context), items);

export const updateApiList = (
  context: vscode.ExtensionContext,
  change: (items: ApiDetailsData[]) => ApiDetailsData[],
) => updateApiListForWorkspace(context, getApiListName(context), change);

export const updateApiListForWorkspace = (
  context: vscode.ExtensionContext,
  workspace: string,
  change: (items: ApiDetailsData[]) => ApiDetailsData[],
) => updateDataInGlobalStorage(context, workspace, change);

export const getApiListName = (context: vscode.ExtensionContext) => {
  try {
    let user_config: any = context.globalState.get("userConfig") || {};
    let apiListName = "apiList";
    if (
      user_config?.currentProject &&
      user_config?.currentProject?.project_id !== "-1"
    ) {
      apiListName = apiListName + `:${user_config.currentProject.project_id}`;
    } else {
    }
    return apiListName;
  } catch (error) {
    return "apiList";
  }
};

/** Editor persistence stays here; document models do not know sharing or repository layout. */
export async function readEditorRequest(
  context: vscode.ExtensionContext,
  uri: vscode.Uri,
  workspace: string,
  id: string,
): Promise<ApiDetailsData | undefined> {
  if (uri.scheme !== "onapi-editor") {
    return parseEditorRequest(await readEditorJson(uri));
  }
  return getDataFromGlobalStorage(context, workspace, []).find(
    (item: ApiDetailsData) => item.id === id,
  );
}

export const parseEditorRequest = (value: unknown) =>
  editorRecordSchema.parse(value) as ApiDetailsData;
export const readEditorJson = async (uri: vscode.Uri) =>
  JSON.parse(new TextDecoder().decode(await vscode.workspace.fs.readFile(uri)));

export async function writeEditorRequestFile(
  uri: vscode.Uri,
  data: ApiDetailsData,
  token: vscode.CancellationToken,
) {
  if (token.isCancellationRequested) {
    throw new vscode.CancellationError();
  }
  await vscode.workspace.fs.writeFile(
    uri,
    new TextEncoder().encode(
      JSON.stringify(requestDefinition(data), null, 2) + "\n",
    ),
  );
}

export async function writeEditorRequest(
  context: vscode.ExtensionContext,
  uri: vscode.Uri,
  workspace: string,
  data: ApiDetailsData,
  exists: boolean,
  check: () => void,
  token: vscode.CancellationToken,
) {
  const definition = requestDefinition(cloneDeep(data));
  if (!definition.name?.trim()) {
    definition.name = DEFAULT_TARGET_NAME[definition.kind] || "HTTP Request";
  }
  check();
  if (uri.scheme !== "onapi-editor") {
    await writeEditorRequestFile(uri, definition, token);
    return definition;
  }
  let missing = false;
  const saved = await updateApiListForWorkspace(context, workspace, (items) => {
    check();
    const index = items.findIndex((item) => item.id === definition.id);
    if (index >= 0) {
      items[index] = definition;
    } else if (!exists) {
      definition.sort = getMaxSort(items, definition.parentId);
      items.push(definition);
    } else {
      missing = true;
    }
    return items;
  });
  if (!saved || missing) {
    throw new Error(
      missing
        ? "This request was removed from storage"
        : "Failed to save requests",
    );
  }
  return definition;
}
