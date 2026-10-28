import type { HttpEditorRecord } from "@onapi/domain/requests/record";
import { createContext } from "react";

type Props = {
  kind: HttpEditorRecord["kind"] | undefined;
  apiData: HttpEditorRecord | undefined;
  onApisDataChange: (data: HttpEditorRecord) => void;
};

const GraphQLResponseContext = createContext<Props>({
  kind: undefined,
  apiData: undefined,
  onApisDataChange: function () {},
});

export default GraphQLResponseContext;
