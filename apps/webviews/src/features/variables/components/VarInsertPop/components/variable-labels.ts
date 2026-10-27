import { VAR_OPTIONS_KEY } from "@/features/variables/constants/variable";

// Keep translation keys here; resolve labels during rendering after locale setup
// and whenever the user changes language.
export const variableLabels: Record<
  VAR_OPTIONS_KEY,
  { title: string; description: string; input: string }
> = {
  [VAR_OPTIONS_KEY.var]: {
    title: "var_insert.quote_var",
    description: "var_insert.quote_var_desc",
    input: "supplement.var_name",
  },
  [VAR_OPTIONS_KEY.mock]: {
    title: "var_insert.mock_data",
    description: "var_insert.mock_data_desc",
    input: "settings.mock_rules.mock_rule",
  },
  [VAR_OPTIONS_KEY.fixed]: {
    title: "var_insert.fixed_value",
    description: "var_insert.fixed_value_desc",
    input: "var_insert.fixed_value",
  },
  [VAR_OPTIONS_KEY.ai_value]: {
    title: "var_insert.ai_value",
    description: "var_insert.ai_value_desc",
    input: "var_insert.api_fixed_type",
  },
  [VAR_OPTIONS_KEY.desc]: {
    title: "settings.description.title",
    description: "var_insert.des_desc",
    input: "",
  },
  [VAR_OPTIONS_KEY.ai_desc]: {
    title: "var_insert.ai_des",
    description: "var_insert.ai_des_desc",
    input: "",
  },
};
