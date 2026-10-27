import { useCallback, useRef, useState } from "react";
import useVariablePreview from "@/features/variables/components/VarInsertPop/components/useVariablePreview";

interface PendingPreview {
  value: string;
  resolve: (value: string) => void;
  reject: () => void;
}

function Preview({
  value,
  enabled,
  start,
}: {
  value: string;
  enabled: boolean;
  start: (value: string) => Promise<string>;
}) {
  const load = useCallback(() => start(value), [start, value]);
  const preview = useVariablePreview({
    load,
    delay: 50,
    enabled,
    fallback: `fallback:${value}`,
  });
  return (
    <>
      <output aria-label="Preview result">{preview.text}</output>
      <output aria-label="Preview loading">{String(preview.loading)}</output>
      <button onClick={preview.refresh}>Refresh preview</button>
    </>
  );
}

export default function VariablePreviewFixture() {
  const [value, setValue] = useState("old");
  const [mounted, setMounted] = useState(true);
  const [enabled, setEnabled] = useState(true);
  const [requests, setRequests] = useState<string[]>([]);
  const pending = useRef<PendingPreview[]>([]);
  const start = useCallback(
    (value: string) =>
      new Promise<string>((resolve, reject) => {
        pending.current.push({
          value,
          resolve,
          reject: () => reject(new Error("preview failure")),
        });
        setRequests((requests) => [...requests, value]);
      }),
    [],
  );
  const settle = (value: string, fail = false) => {
    const request = pending.current.findIndex(
      (request) => request.value === value,
    );
    if (request < 0) {
      throw new Error(`No pending preview: ${value}`);
    }
    const [preview] = pending.current.splice(request, 1);
    if (fail) {
      preview.reject();
    } else {
      preview.resolve(`${value}:result`);
    }
  };
  return (
    <main>
      {mounted && <Preview value={value} enabled={enabled} start={start} />}
      <output aria-label="Preview requests">{JSON.stringify(requests)}</output>
      <button onClick={() => setValue("new")}>New preview input</button>
      <button onClick={() => settle("old")}>Resolve old preview</button>
      <button onClick={() => settle("new")}>Resolve new preview</button>
      <button onClick={() => settle("old", true)}>Reject old preview</button>
      <button onClick={() => settle("new", true)}>Reject new preview</button>
      <button onClick={() => setEnabled(false)}>Disable preview</button>
      <button onClick={() => setMounted((mounted) => !mounted)}>
        Toggle preview mount
      </button>
    </main>
  );
}
