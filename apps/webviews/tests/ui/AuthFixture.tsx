import { useStorage } from "@/app/store";
import useUserConfig from "@/features/auth/store/useUserConfig";
import { readAuthValues } from "@/features/requests/editor/Request/Auth/auth-state";
import OAuth2 from "@/features/requests/editor/Request/Auth/components/OAuth2";
import { useState } from "react";
import {
  AuthField,
  AuthContext,
} from "@/features/requests/editor/Request/Auth/AuthField";
import { Input, Checkbox } from "@/shared/ui/base";

export default function AuthFixture() {
  const [value, setValue] = useState<any>({
    type: "basic",
    basic: [
      { key: "username", value: "alice" },
      { key: "password", value: "secret" },
    ],
  });
  const [commands, setCommands] = useState<unknown[]>([]);
  window.vscode = {
    postMessage: (command: unknown) =>
      setCommands((current) => [...current, command]),
  } as typeof window.vscode;
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
      {value.type === "oauth2" && <OAuth2 />}
      <button
        onClick={() => {
          const uid = useUserConfig.getState().userInfo.uid;
          const clientId = readAuthValues(value, "oauth2").clientId ?? "";
          useStorage.getState().updateOauthRefreshData({
            [uid]: { [clientId]: { refresh_token: "cached-refresh-token" } },
          });
        }}
      >
        Cache refresh token
      </button>
      <output aria-label="Auth commands">{JSON.stringify(commands)}</output>
      <output aria-label="Auth data">{JSON.stringify(value)}</output>
    </AuthContext.Provider>
  );
}
