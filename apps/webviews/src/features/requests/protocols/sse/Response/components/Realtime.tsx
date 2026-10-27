import { responseText } from "@onapi/http-model";
import ResponseResult from "@/features/requests/response/ResponseResult/ResponseResult";
import ResponseEmpty from "@/features/requests/response/Response/components/Empty";
import styles from "./Realtime.module.css";

export default function Realtime({ sendingDataSSE }: { sendingDataSSE: any }) {
  const chunks = (sendingDataSSE?.events || [])
    .filter((event: any) => event.type === "responseData")
    .map((event: any) => event.data)
    .join("");
  const body = chunks || responseText(sendingDataSSE?.response);
  return (
    <div className={styles.container}>
      {body ? (
        <ResponseResult
          rawHtml={body}
          resultIncludesTabs={["native", "beautify"]}
        />
      ) : (
        <ResponseEmpty />
      )}
    </div>
  );
}
