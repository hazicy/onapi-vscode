import { isEqual } from "lodash-es";
import { requestDefinition } from "@onapi/domain";
import type { HttpExecutionState } from "@/features/requests/execution/http-state";
import type { EditorRecord } from "@onapi/domain/requests/record";
import { DEFAULT_REQUEST_SYSTEM_HEADERS } from "@onapi/domain/requests/constants/request";
import { create, devtools } from "@/shared/state/store";

type State = {
  apiOriginDetailsList: EditorRecord[];
  apisActiveData: EditorRecord;
  currentSendingData?: HttpExecutionState;
  currentServerId: string;
  systemRequestHeader: typeof DEFAULT_REQUEST_SYSTEM_HEADERS;
  localProjectApisVersion: Record<string, number>;
  apiCodeHar: unknown;
  schemaLoading: boolean;
};
type Actions = {
  updateApiOriginDetailsList: (items: EditorRecord[]) => void;
  updateApisActiveData: (item: EditorRecord) => void;
  acknowledgeSave: (definition: EditorRecord, submitted: EditorRecord) => void;
  updateCurrentSendingData: (result: HttpExecutionState) => void;
  clearConsole: () => void;
  updateCurrentServerId: (id: string) => void;
  updateLocalProjectApisVersion: (versions: Record<string, number>) => void;
  updateApiCodeHar: (har: any) => void;
  updateSchemaLoading: (loading: boolean) => void;
};

// Derive the lookup from the collection; never maintain a second writable copy.
const indexes = new WeakMap<EditorRecord[], Record<string, EditorRecord>>();
export function selectRequestIndex(state: Pick<State, "apiOriginDetailsList">) {
  const items = state.apiOriginDetailsList;
  let index = indexes.get(items);
  if (!index) {
    index = Object.fromEntries(items.map((item) => [item.id, item]));
    indexes.set(items, index);
  }
  return index;
}

/** The active document is a draft; saved records contain no editor flags. */
export function selectIsDirty(
  state: Pick<State, "apisActiveData" | "apiOriginDetailsList">,
) {
  const draft = state.apisActiveData;
  if (!draft.id) {
    return false;
  }
  const saved = state.apiOriginDetailsList.find((item) => item.id === draft.id);
  return !saved || !isEqual(requestDefinition(draft), requestDefinition(saved));
}

export default create<State & Actions>()(
  devtools(
    (set) => ({
      apiOriginDetailsList: [],
      apisActiveData: {
        id: "",
        parentId: "0",
        name: "",
        kind: "api",
        request: { method: "GET", url: "" },
      },
      currentSendingData: undefined,
      currentServerId: "",
      systemRequestHeader: DEFAULT_REQUEST_SYSTEM_HEADERS,
      localProjectApisVersion: {},
      apiCodeHar: {},
      schemaLoading: false,
      updateApiOriginDetailsList: (items) =>
        set({ apiOriginDetailsList: items }),
      updateApisActiveData: (item) => set({ apisActiveData: item }),
      acknowledgeSave: (definition, submitted) =>
        set((state) => {
          const exists = state.apiOriginDetailsList.some(
            (item) => item.id === definition.id,
          );
          const apiOriginDetailsList = exists
            ? state.apiOriginDetailsList.map((item) =>
                item.id === definition.id ? definition : item,
              )
            : [...state.apiOriginDetailsList, definition];
          const matches =
            state.apisActiveData.id === definition.id &&
            isEqual(
              requestDefinition(state.apisActiveData),
              requestDefinition(submitted),
            );
          return {
            apiOriginDetailsList,
            apisActiveData: matches ? definition : state.apisActiveData,
          };
        }),
      updateCurrentSendingData: (result) => set({ currentSendingData: result }),
      clearConsole: () =>
        set((state) => ({
          currentSendingData: state.currentSendingData && {
            ...state.currentSendingData,
            consoleList: [],
          },
        })),
      updateCurrentServerId: (id) => set({ currentServerId: id }),
      updateLocalProjectApisVersion: (versions) =>
        set({ localProjectApisVersion: versions }),
      updateApiCodeHar: (har) => set({ apiCodeHar: har }),
      updateSchemaLoading: (loading) => set({ schemaLoading: loading }),
    }),
    { name: "useApis" },
  ),
);
