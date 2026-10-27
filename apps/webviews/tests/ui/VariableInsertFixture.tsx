import { useState } from "react";
import VarInsertPop from "@/features/variables/components/VarInsertPop";

export default function VariableInsertFixture() {
  const [open, setOpen] = useState(false);
  return (
    <main>
      <VarInsertPop open={open} setOpen={setOpen} onChange={() => {}}>
        <button type="button">Insert dynamic value</button>
      </VarInsertPop>
      <button type="button">Outside</button>
    </main>
  );
}
