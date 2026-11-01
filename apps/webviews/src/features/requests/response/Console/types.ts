import type { ExecutionEvent } from "@onapi/contracts";

export type ConsoleEntry = {
  level: NonNullable<ExecutionEvent["level"]>;
  args: unknown[];
  time: string;
};

export type ConsoleContentProps = {
  consoleList: ConsoleEntry[];
  onClear?: () => void;
};
