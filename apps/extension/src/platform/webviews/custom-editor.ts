import * as vscode from "vscode";

export interface EditorInput {
  workspace: string;
  data: unknown;
  option?: unknown;
}

type EditorDefinition = { viewType: string } & (
  | {
      resolve(input: EditorInput, panel: vscode.WebviewPanel): void;
      provider?: never;
    }
  | { provider: vscode.CustomReadonlyEditorProvider; resolve?: never }
);

const SCHEME = "onapi-editor";
const STORAGE_KEY = "customEditor.inputs";
const writes = new WeakMap<vscode.ExtensionContext, Promise<void>>();
const editors = new WeakMap<
  vscode.ExtensionContext,
  Map<string, EditorDefinition>
>();

function updateInputs(
  context: vscode.ExtensionContext,
  update: (inputs: Record<string, EditorInput>) => Record<string, EditorInput>,
) {
  const write = (writes.get(context) ?? Promise.resolve())
    .catch(() => {})
    .then(async () => {
      const inputs = context.workspaceState.get<Record<string, EditorInput>>(
        STORAGE_KEY,
        {},
      );
      await context.workspaceState.update(STORAGE_KEY, update(inputs));
    });
  writes.set(context, write);
  return write;
}

/** Register a native provider or adapt a simple read-only feature view. */
export function registerCustomEditor(
  context: vscode.ExtensionContext,
  definition: EditorDefinition,
  getWorkspace: () => string,
) {
  let definitions = editors.get(context);
  if (!definitions) {
    definitions = new Map();
    editors.set(context, definitions);
    context.subscriptions.push(
      vscode.window.tabGroups.onDidChangeTabs((event) => {
        const closed = event.closed.flatMap((tab) => {
          const input = tab.input;
          return input instanceof vscode.TabInputCustom &&
            input.uri.scheme === SCHEME
            ? [input.uri.toString()]
            : [];
        });
        if (closed.length) {
          void updateInputs(context, (inputs) => {
            const next = { ...inputs };
            for (const uri of closed) {
              delete next[uri];
            }
            return next;
          }).catch((error) =>
            console.error("Failed to clean up custom editor inputs", error),
          );
        }
      }),
    );
  }
  definitions.set(definition.viewType, definition);
  const provider: vscode.CustomReadonlyEditorProvider = definition.provider ?? {
    openCustomDocument(uri) {
      return { uri, dispose() {} };
    },
    resolveCustomEditor(document, panel) {
      const input = getEditorInput(context, document.uri);
      if (!input || input.workspace !== getWorkspace()) {
        panel.dispose();
        return;
      }
      definition.resolve!(input, panel);
    },
  };
  context.subscriptions.push(
    vscode.window.registerCustomEditorProvider(definition.viewType, provider, {
      webviewOptions: { retainContextWhenHidden: true, enableFindWidget: true },
      supportsMultipleEditorsPerDocument: false,
    }),
  );
}

/** Stable identities let VS Code deduplicate tabs and restore them after a reload. */
export async function openCustomEditor(
  context: vscode.ExtensionContext,
  viewType: string,
  id: string,
  input: EditorInput,
) {
  if (!editors.get(context)?.has(viewType)) {
    throw new Error(`Custom editor is not registered: ${viewType}`);
  }
  const uri = vscode.Uri.from({
    scheme: SCHEME,
    authority: viewType.toLowerCase(),
    path: `/${viewType}/${encodeURIComponent(input.workspace)}/${encodeURIComponent(id)}`,
  });
  await setEditorInput(context, uri, input);
  await vscode.commands.executeCommand("vscode.openWith", uri, viewType, {
    viewColumn: vscode.ViewColumn.One,
    preview: false,
  });
}

export function getEditorInput(
  context: vscode.ExtensionContext,
  uri: vscode.Uri,
) {
  return context.workspaceState.get<Record<string, EditorInput>>(
    STORAGE_KEY,
    {},
  )[uri.toString()];
}

export function setEditorInput(
  context: vscode.ExtensionContext,
  uri: vscode.Uri,
  input: EditorInput,
) {
  return updateInputs(context, (inputs) => ({
    ...inputs,
    [uri.toString()]: input,
  }));
}
