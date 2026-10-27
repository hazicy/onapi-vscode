import type {
  CompletionContext,
  CompletionResult,
} from "@codemirror/autocomplete";
import createDependencyProposals from "./dependencyProposals";

// Keep the source identity stable across state updates so pending completions can finish.
export function scriptCompletions(
  context: CompletionContext,
): CompletionResult | null {
  const word = context.matchBefore(/[\w$.]+/);
  if (!word && !context.explicit) {
    return null;
  }
  return {
    from: word?.from ?? context.pos,
    options: createDependencyProposals(),
    validFor: /^[\w$.]*$/,
  };
}
