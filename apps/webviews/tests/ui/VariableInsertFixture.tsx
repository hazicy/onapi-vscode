import { useState } from "react";
import VarInsertPop from "@/features/variables/components/VarInsertPop/VarInsertPop";
import { VAR_OPTIONS_KEY } from "@/features/variables/constants/variable";
import { InsertAction } from "@onapi/domain/requests/types/variable";
import VariablePreviewFixture from "./VariablePreviewFixture";

function VariablePopoverFixture() {
  const [open, setOpen] = useState(false);
  const [result, setResult] = useState<unknown>(null);
  const query = new URLSearchParams(location.search);
  const mode = query.get("mode");
  const option = Object.values(VAR_OPTIONS_KEY).find(
    (option) => option === mode,
  );
  return (
    <main>
      <VarInsertPop
        open={open}
        setOpen={setOpen}
        optionKey={option}
        value={query.get("value") || undefined}
        fnList={
          query.has("function")
            ? [{ func_name: "upper", func_desc: "Uppercase", paras: {} }]
            : undefined
        }
        onChange={(
          text: string,
          operation: VAR_OPTIONS_KEY,
          action: InsertAction,
        ) => {
          setResult({ text, operation, action });
          setOpen(false);
        }}
      >
        <button type="button">Insert dynamic value</button>
      </VarInsertPop>
      <output aria-label="Inserted variable">{JSON.stringify(result)}</output>
      <button type="button">Outside</button>
    </main>
  );
}

export default function VariableInsertFixture() {
  return new URLSearchParams(location.search).has("previewLifecycle") ? (
    <VariablePreviewFixture />
  ) : (
    <VariablePopoverFixture />
  );
}
