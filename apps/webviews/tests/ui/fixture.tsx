import EnvironmentDiffFixture from "./EnvironmentDiffFixture";
import ResizeFixture from "./ResizeFixture";
import SharedComponentsProvider from "@/app/providers/SharedComponentsProvider";
import SharedComponentsFixture from "./SharedComponentsFixture";
import BodyFixture from "./BodyFixture";
import AutocompleteFixture from "./AutocompleteFixture";
import VariableInsertFixture from "./VariableInsertFixture";
import DataFixture from "./DataFixture";
import FiltersFixture from "./FiltersFixture";
import AuthFixture from "./AuthFixture";
import { useState } from "react";
import { createRoot } from "react-dom/client";
import "@/shared/locale";
import AiDescription from "@/features/requests/editor/AiDescription/AiDescription";
import useProjectSetting from "@/features/project/store/useProjectSetting";
import useUserConfig from "@/features/auth/store/useUserConfig";
import DrawerFixture from "./DrawerFixture";
import BaseFixture from "./BaseFixture";
import ThemeFixture from "./ThemeFixture";

useProjectSetting.setState({
  descriptionList: [
    {
      id: "custom",
      project_id: "test",
      key: " name ",
      description: "Custom name",
    },
    { id: "other", project_id: "test", key: "age", description: "Custom age" },
    {
      id: "invalid",
      project_id: "test",
      key: "",
      description: "Invalid entry",
    },
  ],
  innerDescriptionList: [
    {
      id: "builtin",
      project_id: "test",
      key: "name",
      description: "Built-in name",
    },
  ],
});

function Fixture() {
  const [filterKey, setFilterKey] = useState("");
  const [value, setValue] = useState("");
  const includeBuiltIn = useUserConfig(
    (state) => state.currentProject.is_describe_library === 1,
  );
  return (
    <main>
      <label>
        Filter key
        <input
          value={filterKey}
          onChange={(event) => setFilterKey(event.target.value)}
        />
      </label>
      <button
        onClick={() =>
          useUserConfig.setState((state) => ({
            currentProject: {
              ...state.currentProject,
              is_describe_library: includeBuiltIn ? -1 : 1,
            },
          }))
        }
      >
        Toggle built-in descriptions
      </button>
      <AiDescription filterKey={filterKey} onChange={setValue} />
      <output aria-label="Selected description">{value}</output>
      <button>Outside</button>
    </main>
  );
}

createRoot(document.getElementById("root")!).render(
  <SharedComponentsProvider>
    {new URLSearchParams(location.search).has("environmentDiff") ? (
      <EnvironmentDiffFixture />
    ) : new URLSearchParams(location.search).has("sharedComponents") ? (
      <SharedComponentsFixture />
    ) : new URLSearchParams(location.search).has("resize") ? (
      <ResizeFixture />
    ) : new URLSearchParams(location.search).has("body") ? (
      <BodyFixture />
    ) : new URLSearchParams(location.search).has("autocomplete") ? (
      <AutocompleteFixture />
    ) : new URLSearchParams(location.search).has("variableInsert") ? (
      <VariableInsertFixture />
    ) : new URLSearchParams(location.search).has("data") ? (
      <DataFixture />
    ) : new URLSearchParams(location.search).has("filters") ? (
      <FiltersFixture />
    ) : new URLSearchParams(location.search).has("auth") ? (
      <AuthFixture />
    ) : new URLSearchParams(location.search).has("theme") ? (
      <ThemeFixture />
    ) : new URLSearchParams(location.search).has("base") ? (
      <BaseFixture />
    ) : new URLSearchParams(location.search).has("drawer") ? (
      <DrawerFixture />
    ) : (
      <Fixture />
    )}
  </SharedComponentsProvider>,
);
