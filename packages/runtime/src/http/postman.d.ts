import type { PostmanCollection, HttpProjectConfig } from "@onapi/http-model";
import type { ExecutionEvent, WorkerRunCommand } from "@onapi/contracts";
export function run(
  collection: PostmanCollection,
  options?: WorkerRunCommand["options"],
  emit?: (event: ExecutionEvent) => void,
): Promise<ExecutionEvent>;
export function serialize(value: unknown): string;
