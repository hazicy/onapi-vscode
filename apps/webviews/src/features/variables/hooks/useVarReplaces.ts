import { useMemo } from "react";
import { variableValueText } from "@onapi/domain/variables/context";
import useProjectConfig from "@/features/project/store/useProjectConfig";
import { variableContext } from "../utils/variable-display";

export default function useVarReplaces() {
  const http = useProjectConfig((state) => state.http);
  const context = useMemo(() => variableContext(http), [http]);
  return {
    varReplace(value: string) {
      return typeof value === "string"
        ? value.replace(/{{([^{}]+)}}/g, (match, name: string) => {
            const entry = context.get(name);
            return entry?.kind === "value"
              ? variableValueText(entry.value)
              : match;
          })
        : value;
    },
  };
}
