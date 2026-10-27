import { scopeValues } from "@/features/project/store/useProjectConfig/selectors";
import i18next from "i18next";
import {
  cloneDeep,
  concat,
  find,
  head,
  indexOf,
  isArray,
  isEqual,
  keys,
  map,
  omit,
  reduce,
  size,
} from "lodash";

import JSON5 from "json5";
import useProjectConfig from "@/features/project/store/useProjectConfig";
import useProjectSetting from "@/features/project/store/useProjectSetting";
import { ApiDetailsData } from "@onapi/http-model/requests/types/api";
import { APIS_TARGET_TYPE_ENUM } from "@onapi/http-model/requests/constants/index";
import { getUpwardFolderId } from "../../../../shared/utils/common";
import { ServerItem } from "@onapi/http-model/environment/types/index";
import { SysConfig } from "@onapi/http-model/settings/types/settings";
import { GraphQLDetailsData } from "@onapi/http-model/requests/types/graphql";

// Get global variables
export const getGlobals = async () => {
  return scopeValues(useProjectConfig.getState().http.options.globals);
};

export const getGlobalFunctionMap = async () => {
  const { functionList } = useProjectSetting.getState();
  return reduce(
    functionList,
    (prev: any, item) => {
      if (item.func_name) {
        prev[item.func_name] = item.func_body as string;
      }
      return prev;
    },
    {},
  );
};
