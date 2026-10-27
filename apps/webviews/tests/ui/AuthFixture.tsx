import Oauth2 from "@/features/requests/components/Request/Auth/components/Oauth2";
import { useState } from "react";
import {
  AuthField,
  AuthContext,
} from "@/features/requests/components/Request/Auth/AuthField";
import { Input, Checkbox } from "@/shared/ui/base";

export default function AuthFixture() {
  const [value, setValue] = useState<any>({
    type: "basic",
    basic: [
      { key: "username", value: "alice" },
      { key: "password", value: "secret" },
    ],
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  return (
    <AuthContext.Provider
      value={{
        value,
        onChange: (_key, next) => setValue(next),
        errors,
        setErrors,
      }}
    >
      <AuthField label="Username" name={["basic", "username"]}>
        <Input />
      </AuthField>
      <AuthField label="Password" name={["basic", "password"]}>
        <Input />
      </AuthField>
      <AuthField
        label="Disable retry"
        name={["ntlm", "disableRetryRequest"]}
        valuePropName="checked"
      >
        <Checkbox />
      </AuthField>
      <button
        onClick={() =>
          setValue({
            type: "basic",
            basic: [{ key: "username", value: "other" }],
          })
        }
      >
        Switch request
      </button>
      <button
        onClick={() => {
          setValue({
            type: "basic",
            basic: [{ key: "username", value: "fresh" }],
          });
        }}
      >
        Reset auth
      </button>
      <button
        onClick={() => {
          setValue({ type: "oauth2" });
        }}
      >
        OAuth2 auth
      </button>
      {value.type === "oauth2" && <Oauth2 onChange={() => {}} />}
      <output aria-label="Auth data">{JSON.stringify(value)}</output>
    </AuthContext.Provider>
  );
}
