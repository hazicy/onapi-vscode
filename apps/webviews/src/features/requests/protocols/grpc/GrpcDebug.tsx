import { useRef, useState } from "react";
import type { GrpcEditorRecord } from "@onapi/domain/requests/record";
import { sendRequestPanelMessage } from "@/shared/bridge/request-panel";
import CodeEditor, {
  type CodeEditorRef,
} from "@/shared/components/CodeEditor/CodeEditor";
import { useGrpc, type GrpcConfigChange } from "./useGrpc";
import { GrpcDefinition } from "./GrpcDefinition";
import {
  GrpcMetadata,
  GrpcAuthorization,
  GrpcSettings,
} from "./GrpcConfiguration";
import { GrpcResponse } from "./GrpcResponse";
import styles from "./GrpcDebug.module.css";

type Props = {
  apisData: GrpcEditorRecord;
  onApisDataChange: (record: GrpcEditorRecord) => void;
};
export default function GrpcDebug({
  apisData: record,
  onApisDataChange: change,
}: Props) {
  const [tab, setTab] = useState(record.grpc.method ? "message" : "definition");
  const controller = useGrpc(record, change);
  const editor = useRef<CodeEditorRef>(null);
  const config = record.grpc;
  const secure =
    config.tls.enabled || /^(?:grpcs|https):\/\//i.test(record.url ?? "");
  const update: GrpcConfigChange = (patch) =>
    change({ ...record, grpc: { ...config, ...patch } });
  const method = controller.methods.find(
    (method) => method.path === config.method,
  );
  const methodType = method
    ? method.requestStream
      ? method.responseStream
        ? "Bidirectional streaming"
        : "Client streaming"
      : method.responseStream
        ? "Server streaming"
        : "Unary"
    : undefined;
  const invoke = () => {
    if (!method) {
      setTab("definition");
      controller.setError(
        "Load a service definition and select a method first",
      );
      return;
    }
    controller.invoke();
  };
  return (
    <section className={styles.workspace}>
      <header className={styles.requestBar}>
        <span className={styles.protocol}>gRPC</span>
        <div className={styles.address}>
          <input
            aria-label="gRPC server address"
            value={record.url ?? ""}
            disabled={controller.busy}
            placeholder="localhost:50051"
            onChange={(e) =>
              change({
                ...record,
                url: e.target.value,
                grpc:
                  config.definition.source === "reflection"
                    ? {
                        ...config,
                        definition: { source: "reflection" },
                        method: "",
                      }
                    : config,
              })
            }
          />
          <button
            className={styles.tlsToggle}
            aria-label="Enable TLS"
            aria-pressed={secure}
            disabled={controller.busy}
            onClick={() =>
              change({
                ...record,
                url: secure
                  ? record.url?.replace(/^(?:grpcs|https):\/\//i, "")
                  : record.url,
                grpc: {
                  ...config,
                  tls: { ...config.tls, enabled: !secure },
                  definition:
                    config.definition.source === "reflection"
                      ? { source: "reflection" }
                      : config.definition,
                },
              })
            }
          >
            <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
              <path
                d="M4.5 7V4.5a3.5 3.5 0 0 1 7 0V7M3 7h10v7H3Z"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.3"
              />
            </svg>
            TLS
          </button>
        </div>
        {controller.methods.length ? (
          <select
            aria-label="gRPC method"
            className={styles.methodSelect}
            value={config.method}
            disabled={controller.busy}
            onChange={(e) => update({ method: e.target.value })}
          >
            {[
              ...new Set(controller.methods.map((method) => method.service)),
            ].map((service) => (
              <optgroup key={service} label={service}>
                {controller.methods
                  .filter((method) => method.service === service)
                  .map((method) => (
                    <option key={method.path} value={method.path}>
                      {method.service}/{method.name}
                      {method.requestStream || method.responseStream
                        ? " ↔"
                        : ""}
                    </option>
                  ))}
              </optgroup>
            ))}
          </select>
        ) : (
          <button
            className={styles.selectMethod}
            disabled={controller.busy}
            onClick={() => setTab("definition")}
          >
            Select a method ▾
          </button>
        )}
        {controller.busy ? (
          <button className={styles.cancel} onClick={controller.cancel}>
            Cancel
          </button>
        ) : (
          <button className={styles.invoke} onClick={invoke}>
            Invoke
          </button>
        )}
        <button
          className={styles.save}
          onClick={() =>
            sendRequestPanelMessage({ action: "saveApiData", data: record })
          }
        >
          Save
        </button>
      </header>
      <nav className={styles.tabs} aria-label="gRPC request tabs">
        {[
          ["message", "Message"],
          [
            "metadata",
            `Metadata${config.metadata.filter((row) => row.enabled && row.key).length ? ` (${config.metadata.filter((row) => row.enabled && row.key).length})` : ""}`,
          ],
          ["auth", "Authorization"],
          ["definition", "Service definition"],
          ["settings", "Settings"],
        ].map(([key, label]) => (
          <button
            key={key}
            aria-pressed={tab === key}
            onClick={() => setTab(key)}
          >
            {label}
          </button>
        ))}
        {methodType && <span className={styles.methodType}>{methodType}</span>}
      </nav>
      {controller.error && (
        <div role="alert" className={styles.error}>
          {controller.error}
        </div>
      )}
      <div className={styles.requestContent}>
        {tab === "message" && (
          <>
            <div className={styles.messageToolbar}>
              <span>{method?.requestType ?? "Request message"}</span>
              <div>
                <button onClick={() => void editor.current?.formatEditor()}>
                  Beautify
                </button>
                <button
                  disabled={!method || controller.busy}
                  onClick={() =>
                    update({
                      message: JSON.stringify(method!.example, null, 2),
                    })
                  }
                >
                  Use example message
                </button>
              </div>
            </div>
            <div
              className={styles.messageEditor}
              role="group"
              aria-label="gRPC message editor"
              onKeyDown={(event) => {
                if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
                  event.preventDefault();
                  controller.busy
                    ? controller.writable && controller.write()
                    : invoke();
                }
              }}
            >
              <CodeEditor
                ref={editor}
                value={config.message}
                onChange={(message) => update({ message })}
                language="json"
                onMountAutoFormat={false}
              />
            </div>
            {method && (
              <details className={styles.fieldDocs}>
                <summary>Message fields · {method.fields.length}</summary>
                <table>
                  <tbody>
                    {method.fields.map((field) => (
                      <tr key={field.name}>
                        <th>{field.name}</th>
                        <td>
                          {field.type}
                          {field.repeated ? "[]" : ""}
                        </td>
                        <td>{field.description}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </details>
            )}
            {controller.busy && controller.phase === "invoke" && (
              <div className={styles.streamActions}>
                <span>
                  {controller.writable
                    ? "Stream is open · compose another message"
                    : "Waiting for the server…"}
                </span>
                {controller.writable && (
                  <>
                    <button onClick={controller.write}>Send message</button>
                    <button
                      className={styles.secondary}
                      onClick={controller.end}
                    >
                      End streaming
                    </button>
                  </>
                )}
              </div>
            )}
          </>
        )}
        {tab !== "message" && (
          <fieldset
            disabled={controller.busy || controller.importing}
            className={styles.editableSection}
          >
            {tab === "definition" && (
              <GrpcDefinition
                config={config}
                update={update}
                controller={controller}
              />
            )}
            {tab === "metadata" && (
              <GrpcMetadata config={config} update={update} />
            )}
            {tab === "auth" && (
              <GrpcAuthorization config={config} update={update} />
            )}
            {tab === "settings" && (
              <GrpcSettings config={config} update={update} />
            )}
          </fieldset>
        )}
      </div>
      <GrpcResponse controller={controller} />
    </section>
  );
}
