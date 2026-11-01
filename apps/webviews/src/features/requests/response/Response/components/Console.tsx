import type { HttpExecutionState } from "@/features/requests/protocols/http/http-state";
import styles from "./Console.module.css";
import { FC, memo } from "react";

import Console from "@/features/requests/response/Console/Console";
import useRequestWorkspaceStore from "@/features/requests/store/useRequestWorkspaceStore";

interface Props {
  sendingData?: HttpExecutionState;
}

const ResponseConsole: FC<Props> = memo(({ sendingData }) => {
  const handleClear = useRequestWorkspaceStore((state) => state.clearConsole);

  return (
    <div className={styles.container}>
      <Console
        consoleList={(sendingData?.consoleList || []).map((event) => ({
          level: event.level || "log",
          args: event.messages || [],
          time: event.timestamp
            ? new Date(event.timestamp).toLocaleTimeString()
            : "",
        }))}
        onClear={handleClear}
      />
    </div>
  );
});

export default ResponseConsole;
