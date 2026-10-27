import { isEqual } from "lodash";
import type {
  EnvironmentScope,
  HttpProjectConfig,
  SerializedCookieJar,
} from "@onapi/http-model";

export interface RuntimeState {
  environment?: EnvironmentScope;
  globals?: HttpProjectConfig["options"]["globals"];
  cookieJar?: SerializedCookieJar;
}

/** Three-way merge: unrelated changes survive; a concurrent edit wins conflicts. */
export function mergeRuntimeEntries<T extends { key?: string }>(
  before: T[] = [],
  result: T[] = [],
  current: T[] = [],
  identity: (entry: T) => string = (entry) => entry.key || "",
) {
  const base = new Map(before.map((entry) => [identity(entry), entry]));
  const changed = new Map(result.map((entry) => [identity(entry), entry]));
  const merged = new Map(current.map((entry) => [identity(entry), entry]));
  for (const key of new Set([...base.keys(), ...changed.keys()])) {
    if (isEqual(base.get(key), changed.get(key))) {
      continue;
    }
    if (!isEqual(base.get(key), merged.get(key))) {
      continue;
    }
    if (changed.has(key)) {
      merged.set(key, structuredClone(changed.get(key)!));
    } else {
      merged.delete(key);
    }
  }
  return [...merged.values()];
}

export function mergeHttpState(
  before: RuntimeState,
  result: RuntimeState,
  current: HttpProjectConfig,
): HttpProjectConfig {
  const next = structuredClone(current);
  const environment = result.environment;
  if (environment?.id && before.environment?.id === environment.id) {
    next.environments = next.environments.map((scope) =>
      scope.id === environment.id
        ? {
            ...scope,
            values: mergeRuntimeEntries(
              before.environment?.values,
              environment.values,
              scope.values,
            ),
          }
        : scope,
    );
  }
  if (result.globals) {
    next.options.globals = {
      ...next.options.globals,
      values: mergeRuntimeEntries(
        before.globals?.values,
        result.globals.values,
        next.options.globals?.values,
      ),
    };
  }
  if (result.cookieJar) {
    const currentJar = next.options.requester?.cookieJar;
    next.options.requester = {
      ...next.options.requester,
      cookieJar: {
        ...result.cookieJar,
        ...currentJar,
        cookies: mergeRuntimeEntries(
          before.cookieJar?.cookies,
          result.cookieJar.cookies,
          currentJar?.cookies,
          (cookie) => JSON.stringify([cookie.domain, cookie.path, cookie.key]),
        ),
      },
    };
  }
  return next;
}
