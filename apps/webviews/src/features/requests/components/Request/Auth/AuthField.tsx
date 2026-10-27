import {
  cloneElement,
  createContext,
  useContext,
  useId,
  type ReactElement,
  type ReactNode,
} from "react";
import { useTranslation } from "react-i18next";
import { Field } from "@/shared/ui/base/Field";
import { readAuthValues, updateAuthValues } from "./authState";

type AuthContextValue = {
  value: any;
  onChange: (key: "auth", value: any) => void;
  errors: Record<string, string>;
  setErrors: (errors: Record<string, string>) => void;
};
export const AuthContext = createContext<AuthContextValue | null>(null);
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("Auth controls require an auth context");
  }
  return context;
}
export function useAuthValues(type: string) {
  const { value } = useAuth();
  return readAuthValues(value, type);
}

// This adapter only binds the two auth data formats, without a separate form store.
export function AuthField({
  name,
  children,
  valuePropName = "value",
  noStyle,
  label,
  hidden,
  style,
  className,
}: {
  name?: [string, string];
  children: ReactNode;
  valuePropName?: string;
  noStyle?: boolean;
  label?: ReactNode;
  hidden?: boolean;
  style?: React.CSSProperties;
  className?: string;
  labelCol?: unknown;
  tooltip?: ReactNode;
}) {
  const context = useAuth();
  const { t } = useTranslation();
  const id = useId();
  if (!name) {
    return <>{children}</>;
  }
  const [type, field] = name;
  const key = type === "bearer" && field === "key" ? "token" : field;
  const current = readAuthValues(context.value, type);
  const error = type === "oauth2" ? context.errors[field] : undefined;
  const control = cloneElement(children as ReactElement<any>, {
    id,
    "aria-invalid": !!error,
    "aria-describedby": error ? `${id}-error` : undefined,
    [valuePropName]: current[key] ?? (valuePropName === "checked" ? false : ""),
    onChange: (input: any) => {
      const value = input?.target
        ? input.target[valuePropName === "checked" ? "checked" : "value"]
        : input;
      context.onChange(
        "auth",
        updateAuthValues(context.value, type, { [key]: value }),
      );
      if (error) {
        const next = { ...context.errors };
        delete next[field];
        context.setErrors(next);
      }
    },
  });
  if (hidden) {
    return null;
  }
  if (noStyle) {
    return control;
  }
  return (
    <Field
      id={id}
      label={label}
      error={error ? t("supplement.required") : undefined}
      style={style}
      className={className}
    >
      {control}
    </Field>
  );
}
