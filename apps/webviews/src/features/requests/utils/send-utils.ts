import { scopeValues } from "@/features/project/store/useProjectConfig/selectors";

import useProjectConfig from "@/features/project/store/useProjectConfig";

// Get global variables
export const getGlobals = async () => {
  return scopeValues(useProjectConfig.getState().http.options.globals);
};
