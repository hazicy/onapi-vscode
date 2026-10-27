import { isEqual } from "lodash-es";
import type { EnvListItem } from "@onapi/domain/environment/types/index";

/** Cloud environment fields used by conflict comparison. Runtime values are local only. */
export const formatEnv = (data?: EnvListItem) => ({
  base_info: { "[Environment Name]name": data?.name ?? "" },
  server_list: (data?.server_list ?? []).map(({ name, uri }) => ({
    "[Server Name]key": name,
    "[Base URL]value": uri,
  })),
  env_var_list: Object.entries(data?.env_var_list ?? {}).map(([key, item]) => ({
    "[Variables]key": key,
    "[Cloud Value]value": item.value,
    "[Description]description": item.description,
  })),
});

export type EnvironmentSection = keyof ReturnType<typeof formatEnv>;
export const ENVIRONMENT_SECTIONS: EnvironmentSection[] = [
  "base_info",
  "server_list",
  "env_var_list",
];

export const compareEnvironments = (
  previous?: EnvListItem,
  next?: EnvListItem,
) => {
  if (!previous || !next) {
    return [];
  }
  const before = formatEnv(previous);
  const after = formatEnv(next);
  return ENVIRONMENT_SECTIONS.filter(
    (key) => !isEqual(before[key], after[key]),
  ).map((key) => ({
    key,
    previous: before[key],
    next: after[key],
  }));
};
