import { isEqual } from "lodash-es";
import { requestDefinition } from "@onapi/domain";
import type { HttpExecutionState } from "@/features/requests/protocols/http/http-state";
import type { EditorRecord } from "@onapi/domain/requests/record";
import { DEFAULT_REQUEST_SYSTEM_HEADERS } from "@onapi/domain/requests/constants/request";
import { create, devtools } from "@/shared/state/store";

type State = {
  savedRequests: EditorRecord[];
  activeRequest: EditorRecord;
  httpExecution?: HttpExecutionState;
  currentServerId: string;
  systemRequestHeader: typeof DEFAULT_REQUEST_SYSTEM_HEADERS;
  requestHar: unknown;
  schemaLoading: boolean;
};
type Actions = {
  setSavedRequests: (items: EditorRecord[]) => void;
  setActiveRequest: (item: EditorRecord) => void;
  acknowledgeSave: (definition: EditorRecord, submitted: EditorRecord) => void;
  setHttpExecution: (result: HttpExecutionState) => void;
  clearConsole: () => void;
  setCurrentServerId: (id: string) => void;
  setRequestHar: (har: unknown) => void;
  setSchemaLoading: (loading: boolean) => void;
};

// Derive the lookup from the collection; never maintain a second writable copy.
const indexes = new WeakMap<EditorRecord[], Record<string, EditorRecord>>();
export function selectRequestIndex(state: Pick<State, "savedRequests">) {
  const items = state.savedRequests;
  let index = indexes.get(items);
  if (!index) {
    index = Object.fromEntries(items.map((item) => [item.id, item]));
    indexes.set(items, index);
  }
  return index;
}

/** The active document is a draft; saved records contain no editor flags. */
export function selectIsDirty(
  state: Pick<State, "activeRequest" | "savedRequests">,
) {
  const draft = state.activeRequest;
  if (!draft.id) {
    return false;
  }
  const saved = state.savedRequests.find((item) => item.id === draft.id);
  return !saved || !isEqual(requestDefinition(draft), requestDefinition(saved));
}

export default create<State & Actions>()(
  devtools(
    (set) => ({
      savedRequests: [],
      activeRequest: {
        id: "",
        parentId: "0",
        name: "",
        kind: "api",
        request: { method: "GET", url: "" },
      },
      httpExecution: undefined,
      currentServerId: "",
      systemRequestHeader: DEFAULT_REQUEST_SYSTEM_HEADERS,
      requestHar: {},
      schemaLoading: false,
      setSavedRequests: (items) => set({ savedRequests: items }),
      setActiveRequest: (item) => set({ activeRequest: item }),
      acknowledgeSave: (definition, submitted) =>
        set((state) => {
          const exists = state.savedRequests.some(
            (item) => item.id === definition.id,
          );
          const savedRequests = exists
            ? state.savedRequests.map((item) =>
                item.id === definition.id ? definition : item,
              )
            : [...state.savedRequests, definition];
          const matches =
            state.activeRequest.id === definition.id &&
            isEqual(
              requestDefinition(state.activeRequest),
              requestDefinition(submitted),
            );
          return {
            savedRequests,
            activeRequest: matches ? definition : state.activeRequest,
          };
        }),
      setHttpExecution: (result) => set({ httpExecution: result }),
      clearConsole: () =>
        set((state) => ({
          httpExecution: state.httpExecution && {
            ...state.httpExecution,
            consoleList: [],
          },
        })),
      setCurrentServerId: (id) => set({ currentServerId: id }),
      setRequestHar: (har) => set({ requestHar: har }),
      setSchemaLoading: (loading) => set({ schemaLoading: loading }),
    }),
    { name: "useRequestWorkspaceStore" },
  ),
);
