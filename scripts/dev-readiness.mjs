import { setTimeout } from "node:timers/promises";

export const DEV_START = "ONAPI_DEV_START";
export const DEV_READY = "ONAPI_DEV_READY";

export async function findDevServer({ root, signal }) {
  signal?.throwIfAborted();
  try {
    const timeout = AbortSignal.timeout(500);
    const response = await fetch("http://127.0.0.1:8080/__onapi_debug_ready", {
      signal: signal ? AbortSignal.any([signal, timeout]) : timeout,
    });
    if (response.ok) {
      const state = await response.json();
      if (
        state.root === root &&
        typeof state.session === "string" &&
        state.session
      ) {
        return state;
      }
    }
  } catch {
    signal?.throwIfAborted();
  }
  return undefined;
}

export async function waitForDevServer({
  root,
  session,
  signal,
  timeoutMs = 30000,
  intervalMs = 100,
}) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    signal?.throwIfAborted();
    const state = await findDevServer({ root, signal });
    if (state?.session === session) {
      return;
    }
    await setTimeout(intervalMs, undefined, { signal });
  }
  throw new Error(
    "Vite did not become ready for this development session on port 8080.",
  );
}
