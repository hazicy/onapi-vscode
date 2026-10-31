import GrpcFixture from "./GrpcFixture";
import AiMcpFixture from "./AiMcpFixture";
import SocketWorkspaceFixture from "./SocketWorkspaceFixture";
import EnvironmentFixture from "./EnvironmentFixture";
import VariableInputFixture from "./VariableInputFixture";
import RequestPanelFixture from "./RequestPanelFixture";
import RequestScriptsFixture from "./RequestScriptsFixture";
import ResizeFixture from "./ResizeFixture";
import SharedComponentsProvider from "@/app/providers/SharedComponentsProvider";
import SharedComponentsFixture from "./SharedComponentsFixture";
import BodyFixture from "./BodyFixture";
import AutocompleteFixture from "./AutocompleteFixture";
import VariableInsertFixture from "./VariableInsertFixture";
import DataFixture from "./DataFixture";
import FiltersFixture from "./FiltersFixture";
import AuthFixture from "./AuthFixture";
import { createRoot } from "react-dom/client";
import "@/shared/locale";
import DrawerFixture from "./DrawerFixture";
import BaseFixture from "./BaseFixture";
import ThemeFixture from "./ThemeFixture";

createRoot(document.getElementById("root")!).render(
  <SharedComponentsProvider>
    {new URLSearchParams(location.search).has("grpc") ? (
      <GrpcFixture />
    ) : new URLSearchParams(location.search).has("aiMcp") ? (
      <AiMcpFixture />
    ) : new URLSearchParams(location.search).has("socketWorkspace") ? (
      <SocketWorkspaceFixture />
    ) : new URLSearchParams(location.search).has("environment") ? (
      <EnvironmentFixture />
    ) : new URLSearchParams(location.search).has("variableInput") ? (
      <VariableInputFixture />
    ) : new URLSearchParams(location.search).has("requestPanel") ? (
      <RequestPanelFixture />
    ) : new URLSearchParams(location.search).has("requestScripts") ? (
      <RequestScriptsFixture />
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
      <BaseFixture />
    )}
  </SharedComponentsProvider>,
);
