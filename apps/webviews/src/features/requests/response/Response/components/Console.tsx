import type { HttpExecutionState } from "@/features/requests/execution/http-state";
import styles from "./Console.module.css";
import { FC, memo } from "react";

import Console from "@/features/requests/response/Console/Console";
import useApis from "@/features/requests/store/useApis";
import { ApiSendingData } from "@onapi/domain/requests/types/send";

interface Props {
  sendingData?: HttpExecutionState;
}

const ResponseConsole: FC<Props> = memo(({ sendingData }) => {
  const handleClear = useApis((state) => state.clearConsole);

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
