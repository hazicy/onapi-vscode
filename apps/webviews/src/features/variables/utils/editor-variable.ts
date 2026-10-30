import { getI18n } from "react-i18next";
import useProjectConfig from "@/features/project/store/useProjectConfig";
import {
  variableDisplay,
  variableDisplayText,
  variableContext,
} from "./variable-display";

export const getEditorVariable = async (expression: string) => {
  const { t } = getI18n();
  const variable = variableDisplay(
    expression.slice(2, -2),
    variableContext(useProjectConfig.getState().http),
  );
  return `${expression}\n${t("interaction.configuredValue")}: ${variableDisplayText(variable, t)}`;
};
