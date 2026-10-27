import { createContext } from "react";

import { FilterDataType } from "@onapi/domain/requests/types/graphql";

type Props = {
  filterData: FilterDataType;
  setFilterData: React.Dispatch<FilterDataType>;
  refreshCheck: (d: FilterDataType) => void;
};

const GraphQLQueryContext = createContext<Props>({
  filterData: {},
  setFilterData: function () {},
  refreshCheck: function () {},
});

export default GraphQLQueryContext;
