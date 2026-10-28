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
  // Only the result for the current source and hint is ready to display.
  return formatted?.source === source && formatted.hint === hint
    ? { ...formatted, loading: false }
    : { mode: responseFormatMode(source, hint), value: source, loading: true };
}
