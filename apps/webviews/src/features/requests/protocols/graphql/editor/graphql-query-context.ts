import type { HttpEditorRecord } from "@onapi/domain/requests/record";
import { createContext } from "react";

import { GraphQLChangeFuncType } from "@onapi/domain/requests/types/graphql";

type Props = {
  apiData: HttpEditorRecord;
  onChange: GraphQLChangeFuncType<HttpEditorRecord>;
};

const GraphQLQueryContext = createContext<Props>({
  apiData: {} as HttpEditorRecord,
  onChange: function () {},
});

export default GraphQLQueryContext;
