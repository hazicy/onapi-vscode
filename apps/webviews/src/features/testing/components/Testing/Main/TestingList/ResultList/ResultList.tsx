import type { ExecutionEvent } from "@onapi/contracts";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { requestUrl } from "@onapi/domain";
import { Flex, Typography, Alert } from "@/shared/ui/base";
import Empty from "@/shared/ui/Empty";
import { Drawer } from "@/shared/ui/Drawer";
import ResponseSize from "@/features/requests/response/ResponseSize";
import { itemFailed } from "@/features/testing/utils/native-results";
import styles from "./ResultList.module.css";

export default function ResultList({ groups }: { groups: ExecutionEvent[][] }) {
  const { t } = useTranslation();
  const [selected, setSelected] = useState<ExecutionEvent[]>();
  const request = selected?.find((event) => event.type === "request");
  const assertions = selected?.flatMap((event) =>
    event.type === "assertion" ? event.assertions || [] : [],
  );
  return (
    <>
      {groups.length ? (
        <div className={styles.container}>
          {groups.map((events, index) => {
            const event = events.find((event) => event.type === "request");
            const cursor = events[0].cursor as { iteration?: number };
            return (
              <Flex
                key={index}
                className={styles.item}
                gap={16}
                justify="space-between"
                onClick={() => setSelected(events)}
              >
                <Typography.Text>
                  {event?.request?.method}{" "}
                  {requestUrl({ request: event?.request })}
                </Typography.Text>
                <Flex gap={16}>
                  {itemFailed(events) ? (
                    <Typography.Text style={{ color: "var(--color-error)" }}>
                      error
                    </Typography.Text>
                  ) : (
                    <ResponseSize response={event?.response} showIcon={false} />
                  )}
                  <Typography.Text>
                    {(cursor.iteration || 0) + 1}
                  </Typography.Text>
                </Flex>
              </Flex>
            );
          })}
        </div>
      ) : (
        <Empty />
      )}
      <Drawer
        title={t("supplement.api_detail")}
        open={Boolean(selected)}
        onClose={() => setSelected(undefined)}
        width={600}
      >
        <Flex vertical gap={12}>
          {selected
            ?.filter((event) => event.error)
            .map((event, index) => (
              <Alert key={index} type="error" message={event.error!.message} />
            ))}
          <ResponseSize
            response={request?.response}
            request={request?.request}
          />
          {assertions?.map((assertion, index) => (
            <Alert
              key={index}
              type={assertion.error ? "error" : "success"}
              message={`${assertion.assertion || assertion.name || "Assertion"}${assertion.skipped ? " (skipped)" : ""}${assertion.error ? `: ${assertion.error.message}` : ""}`}
            />
          ))}
          <Typography.Text>Request</Typography.Text>
          <pre style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>
            {JSON.stringify(request?.request, null, 2)}
          </pre>
          <Typography.Text>Response</Typography.Text>
          <pre style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>
            {JSON.stringify(request?.response, null, 2)}
          </pre>
          <Typography.Text>Console</Typography.Text>
          <pre style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>
            {JSON.stringify(
              selected?.filter((event) => event.type === "console"),
              null,
              2,
            )}
          </pre>
        </Flex>
      </Drawer>
    </>
  );
}
