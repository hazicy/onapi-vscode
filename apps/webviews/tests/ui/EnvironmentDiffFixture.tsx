import { useState } from "react";
import ApisDiffJsonContent from "@/features/sync/components/ApisDiffJsonContent/ApisDiffJsonContent";
import type { EnvListItem } from "@onapi/domain/environment/types/index";

const environment = (value: string): EnvListItem => ({
  env_id: "test",
  name: "Development",
  is_private: -1,
  server_list: [],
  env_var_list: {
    token: {
      value,
      current_value: "private-runtime-value",
      description: "Token",
    },
  },
});
export default function EnvironmentDiffFixture() {
  const [value, setValue] = useState("cloud-token");
  return (
    <>
      <button onClick={() => setValue("local-token")}>
        Use same environment
      </button>
      <button onClick={() => setValue("another-cloud-token")}>
        Switch conflict
      </button>
      <ApisDiffJsonContent
        prevDetails={environment("local-token")}
        nextDetails={environment(value)}
      />
    </>
  );
}
