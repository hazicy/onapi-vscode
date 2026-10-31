import type * as vscode from "vscode";
import { ExecutionScope } from "@onapi/core";

type Owner = { scope: ExecutionScope; registrations: Set<Set<ExecutionScope>> };
const owners = new WeakMap<object, Owner>();
const contexts = new WeakMap<vscode.ExtensionContext, Set<ExecutionScope>>();
function release(owner: Owner) {
  for (const registered of owner.registrations) {
    registered.delete(owner.scope);
  }
  owner.registrations.clear();
  return owner.scope.dispose();
}
/** A panel and a headless test runner use the same resource ownership boundary. */
export function executionScopeFor(
  owner: object,
  context?: vscode.ExtensionContext,
) {
  let state = owners.get(owner);
  if (!state) {
    state = { scope: new ExecutionScope(), registrations: new Set() };
    owners.set(owner, state);
    const panel = owner as Partial<Pick<vscode.WebviewPanel, "onDidDispose">>;
    panel.onDidDispose?.(() => {
      void release(state!);
    });
  }
  if (context && !state.scope.disposed) {
    let registered = contexts.get(context);
    if (!registered) {
      registered = new Set();
      contexts.set(context, registered);
      context.subscriptions.push({
        dispose: () => {
          for (const scope of registered!) {
            void scope.dispose();
          }
          registered!.clear();
        },
      });
    }
    registered.add(state.scope);
    state.registrations.add(registered);
  }
  return state.scope;
}
export function disposeExecutionOwner(owner: object) {
  const state = owners.get(owner);
  return state ? release(state) : Promise.resolve();
}
