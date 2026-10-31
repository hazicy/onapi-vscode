import runtime from "postman-runtime";
import sdk from "postman-collection";
import { CookieJar } from "@postman/tough-cookie";
import fs from "node:fs";
import { StringDecoder } from "node:string_decoder";

// Worker transport for the official API. No request/task/result format conversion.
export async function run(collection, options = {}, emit = () => {}) {
  const environment = new sdk.VariableScope(options.environment || {});
  const globals = new sdk.VariableScope(options.globals || {});
  const variables = new sdk.VariableScope(options.localVariables || {});
  const cookieJar = options.requester?.cookieJar
    ? CookieJar.deserializeSync(options.requester.cookieJar)
    : new CookieJar();
  const settings = {
    ...options,
    environment,
    globals,
    localVariables: variables,
    requester: { ...options.requester, cookieJar },
    fileResolver: fs,
  };
  if (options.certificates) {
    settings.certificates = new sdk.CertificateList({}, options.certificates);
  }
  if (options.proxies) {
    settings.proxies = new sdk.ProxyConfigList({}, options.proxies);
  }
  return new Promise((resolve, reject) => {
    new runtime.Runner().run(
      new sdk.Collection(collection),
      settings,
      (error, execution) => {
        if (error) {
          return reject(error);
        }
        let currentEnvironment = environment;
        let currentGlobals = globals;
        function scopes(results) {
          for (const execution of results || []) {
            if (execution.result?.environment) {
              currentEnvironment = execution.result.environment;
            }
            if (execution.result?.globals) {
              currentGlobals = execution.result.globals;
            }
          }
        }
        let decoder = new StringDecoder("utf8");
        execution.start({
          start(error, cursor) {
            emit({ type: "start", error, cursor });
          },
          beforeItem(error, cursor, item) {
            emit({ type: "beforeItem", error, cursor, item });
          },
          request(error, cursor, response, request, item, cookies, history) {
            const tail = decoder.end();
            if (tail) {
              emit({ type: "responseData", cursor, data: tail });
            }
            emit({
              type: "request",
              error,
              cursor,
              response,
              request,
              item,
              cookies,
              history,
            });
          },
          responseStart(error, cursor, response, request) {
            decoder = new StringDecoder("utf8");
            emit({ type: "responseStart", error, cursor, response, request });
          },
          responseData(cursor, data) {
            emit({
              type: "responseData",
              cursor,
              data: decoder.write(Buffer.from(data)),
            });
          },
          console(cursor, level, ...messages) {
            emit({ type: "console", cursor, level, messages });
          },
          assertion(cursor, assertions) {
            emit({ type: "assertion", cursor, assertions });
          },
          exception(cursor, error) {
            emit({ type: "exception", cursor, error });
          },
          prerequest(error, cursor, results, item) {
            scopes(results);
            emit({ type: "prerequest", error, cursor, results, item });
          },
          test(error, cursor, results, item) {
            scopes(results);
            emit({ type: "test", error, cursor, results, item });
          },
          item(error, cursor, item, visualizer) {
            emit({ type: "item", error, cursor, item, visualizer });
          },
          done(error, cursor) {
            const result = {
              type: "done",
              error,
              cursor,
              environment: currentEnvironment.toJSON(),
              globals: currentGlobals.toJSON(),
              cookieJar: cookieJar.toJSON(),
            };
            emit(result);
            resolve(result);
          },
        });
      },
    );
  });
}

export function serialize(value) {
  return JSON.stringify(value, (key, entry) =>
    entry instanceof Error
      ? {
          name: entry.name,
          message: entry.message,
          code: entry.code,
          stack: entry.stack,
        }
      : entry,
  );
}
