import {
  selectActiveEnvironment,
  scopeValues,
} from "@/features/project/store/useProjectConfig/selectors";
import { getI18n } from "react-i18next";
import { getGlobals } from "../../features/requests/utils/send/utils";
import useProjectConfig from "@/features/project/store/useProjectConfig";
import { has, merge } from "lodash";
import { convertVarFormat } from "./common";

export const getEditorVariable = async (originKey: string) => {
  try {
    const { t } = getI18n();
    const keyName = originKey.substring(2, originKey.length - 2);
    const global = await getGlobals();
    const environmentMap = scopeValues(
      selectActiveEnvironment(useProjectConfig.getState()),
    );
    const varMap = merge(global, environmentMap);
    if (has(varMap, keyName)) {
      return `**${t("supplement.current_value")}**  **:** ${convertVarFormat(varMap[keyName])}`;
    }
  } catch (err) {
    return "";
  }
};
