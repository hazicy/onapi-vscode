import {
  createContext,
  useContext,
  type ComponentType,
  type ReactNode,
} from "react";
import { Input } from "@/shared/ui/base";

export interface VariableInputProps {
  envId?: string;
  value?: string;
  readOnly?: boolean;
  placeholder?: string;
  suffix?: ReactNode;
  maxLength?: number;
  onChange?: (value: string) => void;
  onBlur?: (value: string) => void;
  wrapClassName?: string;
  disabledReturn?: boolean;
}

export interface VariableInsertProps {
  children: ReactNode;
  open: boolean;
  setOpen: (open: boolean) => void;
  isInsertDynamic?: boolean;
  onChange: (
    value: string,
    target: "value" | "description",
    append: boolean,
  ) => void;
}

const PlainInput = ({
  value,
  onChange,
  onBlur,
  wrapClassName,
  suffix,
  readOnly,
  placeholder,
  maxLength,
}: VariableInputProps) => (
  <Input
    value={value}
    readOnly={readOnly}
    placeholder={placeholder}
    maxLength={maxLength}
    className={wrapClassName}
    suffix={suffix}
    onChange={(event) => onChange?.(event.target.value)}
    onBlur={(event) => onBlur?.(event.target.value)}
  />
);

export const VariableControlsContext = createContext<{
  Input: ComponentType<VariableInputProps>;
  Insert?: ComponentType<VariableInsertProps>;
}>({ Input: PlainInput });

export const useVariableControls = () => useContext(VariableControlsContext);
