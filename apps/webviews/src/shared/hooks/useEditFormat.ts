import { useEffect, useState } from "react";
import { EditFormat, responseFormatMode } from "@/shared/utils/editFormat";

export default function useEditFormat(source: string, hint?: string) {
  const [formatted, setFormatted] = useState<{
    source: string;
    hint?: string;
    mode: string;
    value: string;
  }>();
  useEffect(() => {
    let current = true;
    void EditFormat(source, hint).then((result) => {
      if (current) {
        setFormatted({ ...result, source, hint });
      }
    });
    return () => {
      current = false;
    };
  }, [source, hint]);
  // Display new responses immediately, ignoring any stale asynchronous result.
  return formatted?.source === source && formatted.hint === hint
    ? formatted
    : { mode: responseFormatMode(source, hint), value: source };
}
