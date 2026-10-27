import type { HttpEditorRecord } from "@onapi/domain/requests/record";
import { useMemoizedFn } from "ahooks";
import { GraphQLChangeFuncType } from "@onapi/domain/requests/types/graphql";
import GraphQLQueryContext from "./context/GraphQLQueryContext";
import GraphQLQueryEditor from "./GraphQLQueryEditor";

interface Props {
  requestData: HttpEditorRecord["request"];
  apiData: HttpEditorRecord;
  id: string;
  onChange: GraphQLChangeFuncType<HttpEditorRecord>;
}

export default function GraphQLQuery({
  requestData,
  apiData,
  onChange,
}: Props) {
  const update = useMemoizedFn(
    (body: import("@onapi/domain").HttpRequestBody) =>
      onChange("request", { ...requestData, body }),
  );
  return (
    <GraphQLQueryContext.Provider value={{ apiData, onChange }}>
      <GraphQLQueryEditor
        data={{ ...requestData.body, mode: "graphql" }}
        onChange={update}
      />
    </GraphQLQueryContext.Provider>
  );
}
