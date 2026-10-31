import {
  executionScopeFor,
  disposeExecutionOwner,
} from "../../../platform/execution/owners";
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

export function stopWorker(owner: object, executionId?: string) {
  const execution = executionScopeFor(owner).get("http");
  if (execution && (!executionId || execution.sessionId === executionId)) {
    void execution.cancel();
    execution.finish();
  }
}
export function reserveHttpExecution(
  owner: object,
  executionId: string,
  context: vscode.ExtensionContext,
) {
  executionScopeFor(owner, context).reserve("http", executionId);
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
  owner?: object,
  executionId?: string,
) {
  const ephemeral = !owner;
  owner ??= {};
  if (
    executionId &&
    executionScopeFor(owner).get("http")?.sessionId !== executionId
  ) {
    return Promise.resolve();
  }
  if (!executionId) {
    stopWorker(owner);
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
  const scope = executionScopeFor(owner, context);
  const session = executionId
    ? scope.get("http")!
    : scope.reserve("http", randomUUID());
  session.targetId = options?.entrypoint?.execute;
  let persistedState: Promise<boolean> = Promise.resolve(true);
  return session
    .execute(
      executionService,
      execution,
      { collection, options: executionOptions },
      (envelope) => {
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
    )
    .finally(async () => {
      await persistedState;
      if (ephemeral) {
        await disposeExecutionOwner(owner!);
      }
    });
}
export const sendApi = (
  data: HttpRequestItem,
  context: vscode.ExtensionContext,
  emit: (event: ExecutionEnvelope) => void,
  owner?: object,
  executionId?: string,
) => {
  if (
    executionId &&
    (!owner || executionScopeFor(owner).get("http")?.sessionId !== executionId)
  ) {
    return Promise.resolve();
  }
  return runCollection(
    requestCollection(data, context),
    { entrypoint: { execute: data.id, lookupStrategy: "idOrName" } },
    context,
    emit,
    owner,
    executionId,
  );
};
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
export async function getResolvedCodeRequest(
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
    settings.collection.variable || [],
    settings.options.globals.values || [],
  ].map(
    (values) =>
      new sdk.VariableList(
        new sdk.Property({}),
        values.map((value) => new sdk.Variable(value)),
      ),
  );
  const resolved = sdk.Property.replaceSubstitutionsIn(
    data.request,
    variables,
    false,
  );
  const { auth } = resolved;
  const authType = auth?.type;
  // The SDK supports extension auth types that its published TS definitions omit.
  // Its string-based use() API accepts those types without widening our model.
  if (authType === "jwt" || authType === "asap") {
    const request = new sdk.Request({
      ...resolved,
      auth: { ...auth, type: undefined },
    });
    request.auth?.use(
      authType,
      new sdk.VariableList(
        new sdk.Property({}),
        (auth?.[authType] || []).map((value) => new sdk.Variable(value)),
      ),
    );
    return request;
  }
  return new sdk.Request({
    ...resolved,
    auth: auth ? { ...auth, type: authType } : undefined,
  });
}

export async function getCodeHarRequest(
  data: Pick<HttpRequestItem, "request">,
  context: vscode.ExtensionContext,
  options?: unknown,
) {
  const request = await getResolvedCodeRequest(data, context, options);
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
