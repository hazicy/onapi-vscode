import { createContext } from "react";

import {
  MOCK_TABS_KEY,
  VAR_OPTIONS_KEY,
} from "@/features/variables/constants/variable";
import {
  FuncListRenderItem,
  InsertAction,
} from "@onapi/domain/requests/types/variable";

const VariableInsertContext = createContext<{
  optionKey: VAR_OPTIONS_KEY;
  stepChange: (obj: {
    key?: VAR_OPTIONS_KEY;
    step?: number | undefined;
  }) => void;
  onChange: (str: string, action: InsertAction) => void;
  value?: string;
  valueChange?: React.Dispatch<string>;
  setOpen?: React.Dispatch<boolean>;
  isEdit: boolean;
  fixedRefresh?: () => void;
  originFnList?: FuncListRenderItem[];
  originMockTabsKey?: MOCK_TABS_KEY;
  originFakerJsParamList?: { key: string; value: any }[];
  isInsertDynamic?: boolean;
  originFormatInfo?: any;
  step: number;
}>({
  optionKey: VAR_OPTIONS_KEY.var,
  stepChange: function (): void {},
  onChange: function (): void {},
  value: "",
  isEdit: false,
  originMockTabsKey: MOCK_TABS_KEY.faker,
  originFakerJsParamList: [],
  isInsertDynamic: false,
  originFormatInfo: {},
  step: 1,
});

export default VariableInsertContext;
