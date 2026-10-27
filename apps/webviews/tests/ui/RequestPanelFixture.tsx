import { useState } from "react";
import HttpDebug from "@/features/requests/protocols/http/HttpDebug";
import ResponseResult from "@/features/requests/response/ResponseResult/ResponseResult";
import useApis from "@/features/requests/store/useApis";
import workspaceStyles from "@/features/requests/RequestWorkspace.module.css";

export default function RequestPanelFixture() {
  const [width, setWidth] = useState(1000);
  const [item, setItem] = useState<any>({
    id: "ui-request",
    kind: "api",
    name: "Request UI",
    parentId: "0",
    project_id: "-1",
    request: {
      method: "GET",
      url: "https://example.test?token=value",
      header: [],
    },
    event: [],
    response: [],
  });
  window.vscode = {
    postMessage: (message: unknown) => {
      (window as any).requestMessages ||= [];
      (window as any).requestMessages.push(message);
    },
  } as typeof window.vscode;
  return (
    <>
      <button onClick={() => setWidth(420)}>Narrow panel</button>
      <button onClick={() => setWidth(1000)}>Wide panel</button>
      <button
        onClick={() =>
          useApis
            .getState()
            .updateCurrentSendingData({
              sendStatus: "sendError",
              message: "connect ECONNREFUSED example.test",
            })
        }
      >
        Fail request
      </button>
      <section
        aria-label="Request workspace"
        style={{
          width,
          height: 650,
          display: "flex",
          flexDirection: "column",
          fontFamily: "sans-serif",
          fontSize: "var(--vscode-font-size, 13px)",
        }}
        className={workspaceStyles.apiDebug}
      >
        <HttpDebug apisData={item} onApisDataChange={setItem} />
      </section>
      <section aria-label="Response tools" style={{ width, height: 400 }}>
        <ResponseResult
          rawHtml={'{"message":"hello"}'}
          mode="json"
          resultIncludesTabs={["beautify", "native"]}
        />
      </section>
    </>
  );
}
