import { mergeHttpState } from "./merge-http-state";
import { HttpAdapter } from "@onapi/runtime/http/adapter";
import type { ExecutionEnvelope, WorkerRunCommand } from "@onapi/contracts";
import { executionService } from "../../../platform/execution/service";
import { randomUUID } from "node:crypto";
import type * as vscode from "vscode";
import {
  createDefaultHttpConfig,
  toPostmanCollection,
  type HttpRequestItem,
  type HttpProjectConfig,
  type PostmanCollection,
} from "@onapi/domain";
import {
  getCurrentProjectConfig,
  getProjectWorkspace,
  getProjectConfig,
  saveProjectConfig,
} from "../../../platform/storage/project-config";
import { getApiList, getApiListName } from "../request-storage";
import { setRequestResult } from "../request-status";

const executions = new Map<
  object,
  { adapter: HttpAdapter; cancelled: boolean; context: vscode.ExtensionContext }
>();
const registeredContexts = new WeakSet<vscode.ExtensionContext>();

export function stopWorker(owner: object) {
  const execution = executions.get(owner);
  if (execution) {
    execution.cancelled = true;
    execution.adapter.cancel();
    executions.delete(owner);
  }
}

export function getHttpProjectConfig(
  context: vscode.ExtensionContext,
): HttpProjectConfig {
  return getCurrentProjectConfig(context).http || createDefaultHttpConfig();
}
export function requestCollection(
  data: HttpRequestItem,
  context: vscode.ExtensionContext,
): PostmanCollection {
  const items = getApiList(context);
  const index = items.findIndex((item) => item.id === data.id);
  if (index >= 0) {
    items[index] = data as any;
  } else {
    items.push({
      ...data,
      parentId: items.some((item) => item.id === data.parentId)
        ? data.parentId
        : "0",
    } as any);
  }
  return toPostmanCollection(items, getHttpProjectConfig(context).collection);
}

/** Build SDK definitions only at the execution boundary. */
export function getExecutionCollection(
  context: vscode.ExtensionContext,
): PostmanCollection {
  return toPostmanCollection(
    getApiList(context),
    getHttpProjectConfig(context).collection,
  );
}

export function runCollection(
  collection: PostmanCollection,
  options: Partial<WorkerRunCommand["options"]>,
  context: vscode.ExtensionContext,
  emit: (event: ExecutionEnvelope) => void,
  owner: object = {},
) {
  stopWorker(owner);
  if (!registeredContexts.has(context)) {
    registeredContexts.add(context);
    context.subscriptions.push({
      dispose() {
        for (const [owner, session] of executions) {
          if (session.context === context) {
            stopWorker(owner);
          }
        }
      },
    });
  }
  const statusWorkspace = getApiListName(context);
  const workspace = getProjectWorkspace(context);
  const settings =
    getProjectConfig(context, workspace).http || createDefaultHttpConfig();
  const environment = settings.environments.find(
    (scope) => scope.id === settings.activeEnvironment,
  );
  const executionOptions: WorkerRunCommand["options"] = structuredClone({
    ...settings.options,
    environment,
    ...options,
  });
  const before = structuredClone({
    environment: executionOptions.environment,
    globals: executionOptions.globals,
    cookieJar: executionOptions.requester?.cookieJar,
  });
  const execution = new HttpAdapter(
    new URL("./runtime/worker.js", import.meta.url),
  );
  const session = { adapter: execution, cancelled: false, context };
  executions.set(owner, session);
  let persistedState: Promise<boolean> = Promise.resolve(true);
  return executionService
    .execute(
      execution,
      { collection, options: executionOptions },
      {
        sessionId: randomUUID(),
        targetId: options?.entrypoint?.execute,
        observer: (envelope) => {
          emit(envelope);
          const payload = envelope.event;
          if (!("native" in payload)) {
            return;
          }
          const event = payload.native;
          if (event.type === "request" && !session.cancelled) {
            setRequestResult(
              statusWorkspace,
              (event.item as any)?.id,
              event.response,
              event.error,
            );
          }
          if (
            event.type === "done" &&
            !executionOptions.sandbox &&
            !event.error &&
            !session.cancelled
          ) {
            const config = getProjectConfig(context, workspace);
            const next = mergeHttpState(
              before,
              event,
              config.http || createDefaultHttpConfig(),
            );
            persistedState = saveProjectConfig(context, workspace, {
              ...config,
              http: next,
            });
          }
        },
      },
    )
    .finally(async () => {
      await persistedState;
      if (executions.get(owner) === session) {
        executions.delete(owner);
      }
    });
}
export const sendApi = (
  data: HttpRequestItem,
  context: vscode.ExtensionContext,
  emit: (event: ExecutionEnvelope) => void,
  owner?: object,
) =>
  runCollection(
    requestCollection(data, context),
    { entrypoint: { execute: data.id, lookupStrategy: "idOrName" } },
    context,
    emit,
    owner,
  );
export const sendAutoTest = (
  data: {
    collection: PostmanCollection;
    options?: Partial<WorkerRunCommand["options"]>;
  },
  context: vscode.ExtensionContext,
  _environmentView: unknown,
  emit: (event: ExecutionEnvelope) => void,
) => runCollection(data.collection, data.options || {}, context, emit);

// HAR is an export format. The input here is already a native SDK Request.
export async function getCodeHarRequest(
  data: Pick<HttpRequestItem, "request">,
  context: vscode.ExtensionContext,
  _options?: unknown,
) {
  const { default: sdk } = await import("postman-collection");
  const settings = getHttpProjectConfig(context);
  const env = settings.environments.find(
    (scope) => scope.id === settings.activeEnvironment,
  );
  const variables = [
    env?.values || [],
    settings.options.globals.values || [],
    settings.collection.variable || [],
  ].map(
    (values) =>
      new sdk.VariableList(
        new sdk.Property({}),
        values.map((value) => new sdk.Variable(value)),
      ),
  );
  const request = new sdk.Request(
    sdk.Property.replaceSubstitutionsIn(data.request, variables, false),
  );
  const body = request.body;
  const graphql = body?.mode === "graphql" ? body.graphql : undefined;
  return {
    log: {
      version: "1.2",
      creator: { name: "onapi", version: "1" },
      entries: [
        {
          request: {
            method: request.method,
            url: request.url.toString(),
            httpVersion: "HTTP/1.1",
            headers: request.headers.toJSON().map((header: any) => ({
              name: header.key,
              value: header.value,
            })),
            queryString: request.url.query
              .toJSON()
              .map((item: any) => ({ name: item.key, value: item.value })),
            cookies: [],
            headersSize: -1,
            bodySize: -1,
            ...(body
              ? {
                  postData: {
                    mimeType:
                      request.headers.get("content-type") ||
                      (graphql ? "application/json" : "text/plain"),
                    ...(graphql
                      ? {
                          text: JSON.stringify({
                            query: graphql.query || "",
                            variables:
                              typeof graphql.variables === "string"
                                ? JSON.parse(graphql.variables || "{}")
                                : graphql.variables || {},
                          }),
                        }
                      : body.mode === "raw"
                        ? { text: body.raw }
                        : {
                            params: (
                              (body as any)[body.mode]?.toJSON?.() || []
                            ).map((item: any) => ({
                              name: item.key,
                              value: item.value,
                              fileName: item.src,
                            })),
                          }),
                  },
                }
              : {}),
          },
        },
      ],
    },
  };
}
