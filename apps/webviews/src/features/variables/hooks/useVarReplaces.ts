import useProjectConfig from "@/features/project/store/useProjectConfig";
import {
  scopeValues,
  selectActiveEnvironment,
} from "@/features/project/store/useProjectConfig/selectors";

export default function useVarReplaces() {
  const http = useProjectConfig((state) => state.http);
  const variables = {
    ...scopeValues(http.options.globals),
    ...scopeValues(selectActiveEnvironment({ http })),
  };
  return {
    varReplace(value: string) {
      return typeof value === "string"
        ? value.replace(/{{([^{}]+)}}/g, (match, key: string) =>
            Object.hasOwn(variables, key)
              ? String(variables[key] ?? "")
              : match,
          )
        : value;
    },
  };
}
