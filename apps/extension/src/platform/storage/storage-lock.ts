import { mkdir } from "node:fs/promises";
import { dirname } from "node:path";
import { lock } from "proper-lockfile";

/** One lock outside the data directory also protects startup recovery and resets. */
export async function withStorageFileLock<T>(
  directory: string,
  work: (assertOwned: () => void) => Promise<T>,
): Promise<T> {
  await mkdir(dirname(directory), { recursive: true });
  let compromised: Error | undefined;
  const release = await lock(directory, {
    realpath: false,
    stale: 60_000,
    update: 10_000,
    retries: { retries: 300, factor: 1, minTimeout: 100, maxTimeout: 100 },
    onCompromised: (error) => {
      compromised = error;
    },
  });
  const assertOwned = () => {
    if (compromised) {
      throw compromised;
    }
  };
  try {
    const result = await work(assertOwned);
    assertOwned();
    return result;
  } finally {
    if (!compromised) {
      await release();
    }
  }
}
