import { useEffect, useReducer, useState } from "react";

interface Options {
  enabled: boolean;
  load: () => Promise<string>;
  delay: number;
  fallback: string;
}

// Each effect owns one preview generation. Cleanup invalidates both queued and
// in-flight work, including its loading state, when input changes or unmounts.
export default function useVariablePreview({
  enabled,
  load,
  delay,
  fallback,
}: Options) {
  const [preview, setPreview] = useState({ text: "", loading: false });
  const [revision, refresh] = useReducer((value: number) => value + 1, 0);
  useEffect(() => {
    if (!enabled) {
      setPreview({ text: "", loading: false });
      return;
    }
    let active = true;
    setPreview({ text: "", loading: true });
    const run = async () => {
      try {
        const text = await load();
        if (active) {
          setPreview({ text, loading: false });
        }
      } catch {
        if (active) {
          setPreview({ text: fallback, loading: false });
        }
      }
    };
    const timer = delay ? setTimeout(() => void run(), delay) : undefined;
    if (!delay) {
      void run();
    }
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [enabled, load, delay, fallback, revision]);
  return { ...preview, refresh };
}
