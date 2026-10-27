import { createContext } from "react";

import { APIS_TARGET_TYPE_ENUM } from "@onapi/domain/requests/constants/index";
import { GraphQLDetailsData } from "@onapi/domain/requests/types/graphql";

type Props = {
  kind: APIS_TARGET_TYPE_ENUM | undefined;
  apiData: GraphQLDetailsData | undefined;
  onApisDataChange: (data: GraphQLDetailsData) => void;
};

const GraphQLResponseContext = createContext<Props>({
  kind: undefined,
  apiData: undefined,
  onApisDataChange: function () {},
});

export default GraphQLResponseContext;
