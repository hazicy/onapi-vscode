import type * as vscode from "vscode";
import type { VariableDefinition } from "postman-collection";
import type { SysConfig } from "@onapi/domain/settings/types/settings";
import {
  configuredVariableValues,
  createVariableContext,
} from "@onapi/domain/variables/context";
import { resolveVariables } from "@onapi/domain/variables/resolve";
import { getCurrentProjectConfig } from "../../../platform/storage/project-config";
import { getApiList } from "../request-storage";
import { networkFromSettings } from "../../../platform/execution/network-settings";

/** An immutable execution snapshot; no protocol commands or transport objects live here. */
export function createRequestExecutionContext(
  context: vscode.ExtensionContext,
  targetId: string,
  systemProxy = "",
) {
  const project = getCurrentProjectConfig(context);
  const http = project.http;
  const index = new Map(
    getApiList(context).map((record) => [record.id, record]),
  );
  const ancestors: VariableDefinition[][] = [];
  const seen = new Set<string>();
  let record = index.get(targetId);
  while (record) {
    if (seen.has(record.id)) {
      throw new Error("Circular collection hierarchy");
    }
    seen.add(record.id);
    ancestors.unshift(Array.isArray(record.variable) ? record.variable : []);
    record = index.get(record.parentId);
  }
  const variables = createVariableContext({
    globals: http?.options.globals.values,
    collection: [...(http?.collection.variable ?? []), ...ancestors.flat()],
    environment: http?.environments.find(
      (env) => env.id === http.activeEnvironment,
    )?.values,
  });
  const values = configuredVariableValues(variables);
  const network = networkFromSettings(
    context.globalState.get<SysConfig>("systemConfig") ?? {},
    systemProxy,
  );
  return {
    variables,
    network,
    resolve: <T>(value: T): T => resolveVariables(value, values),
  };
}
