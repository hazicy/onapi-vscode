import { MOCK_TABS_KEY } from "@/features/variables/constants/variable";
import type { FuncListRenderItem } from "@onapi/domain/requests/types/variable";

export interface FakerParameter {
  key: string;
  value: unknown;
}

export interface DateFormat {
  format: string;
  utc: string;
}

export function getDefaultDateFormat(): DateFormat {
  const offset = -new Date().getTimezoneOffset();
  const hours = String(Math.floor(Math.abs(offset) / 60)).padStart(2, "0");
  const minutes = String(Math.abs(offset) % 60).padStart(2, "0");
  return {
    format: "YYYY/MM/DD HH:mm:ss",
    utc: `${offset >= 0 ? "+" : "-"}${hours}:${minutes}`,
  };
}

export interface VariableDraft {
  value: string;
  functions: FuncListRenderItem[];
  parameters: FakerParameter[];
  mockTab: MOCK_TABS_KEY;
  dateFormat: DateFormat;
}

export interface DraftOrigin {
  value?: string;
  functions?: FuncListRenderItem[];
  parameters?: FakerParameter[];
  mockTab?: MOCK_TABS_KEY;
  dateFormat?: Partial<DateFormat>;
}

export function createVariableDraft(origin: DraftOrigin): VariableDraft {
  return {
    value: origin.value || "",
    functions: origin.functions || [],
    parameters: origin.parameters || [],
    mockTab: origin.mockTab || MOCK_TABS_KEY.faker,
    dateFormat: { ...getDefaultDateFormat(), ...origin.dateFormat },
  };
}

export type DraftAction =
  | { type: "value"; value: string }
  | { type: "mock-value"; value: string }
  | { type: "functions"; functions: FuncListRenderItem[] }
  | { type: "parameters"; parameters: FakerParameter[] }
  | { type: "date-format"; dateFormat: Partial<DateFormat> }
  | { type: "mock-tab"; mockTab: MOCK_TABS_KEY }
  | { type: "origin-value"; value?: string; mockTab?: MOCK_TABS_KEY }
  | { type: "option"; origin: DraftOrigin; isEdit: boolean };

export function variableDraftReducer(
  state: VariableDraft,
  action: DraftAction,
): VariableDraft {
  switch (action.type) {
    case "value":
      return { ...state, value: action.value };
    case "mock-value":
      return { ...state, value: action.value, parameters: [] };
    case "functions":
      return { ...state, functions: action.functions };
    case "parameters":
      return { ...state, parameters: action.parameters };
    case "date-format":
      return {
        ...state,
        dateFormat: { ...state.dateFormat, ...action.dateFormat },
      };
    case "mock-tab":
      return { ...state, mockTab: action.mockTab, value: "" };
    case "origin-value":
      return {
        ...state,
        value: action.value || "",
        mockTab: action.mockTab || state.mockTab,
      };
    case "option":
      return {
        ...state,
        value: action.isEdit ? state.value : "",
        functions: action.origin.functions || [],
        parameters: action.origin.parameters || [],
      };
  }
}
