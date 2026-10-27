import { createContext } from "react";

import {
  GraphQLChangeFuncType,
  GraphQLDetailsData,
} from "@onapi/http-model/requests/types/graphql";

type Props = {
  apiData: GraphQLDetailsData;
  onChange: GraphQLChangeFuncType<GraphQLDetailsData>;
};

const GraphQLQueryContext = createContext<Props>({
  apiData: {} as GraphQLDetailsData,
  onChange: function () {},
});

export default GraphQLQueryContext;
