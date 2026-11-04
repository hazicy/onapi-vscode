import { useTranslation } from "react-i18next";
import RequestToolbar from "@/features/requests/components/RequestToolbar";
import RequestTabs from "@/features/requests/components/RequestTabs";
import RequestAction from "@/features/requests/components/RequestAction";
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
  const { t } = useTranslation();

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
        ? t("ui.bidirectional_streaming")
        : t("ui.client_streaming")
      : method.responseStream
        ? t("ui.server_streaming")
        : t("ui.unary")
    : undefined;
  const invoke = () => {
    if (!method) {
      setTab("definition");
      controller.setError(t("ui.grpc_method_required"));
      return;
    }
    controller.invoke();
  };
  return (
    <section className={styles.workspace}>
      <RequestToolbar as="header" className={styles.requestBar}>
        <span className={styles.protocol}>gRPC</span>
        <div className={styles.address}>
          <input
            aria-label={t("ui.grpc_server_address")}
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
            aria-label={t("ui.enable_tls")}
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
            aria-label={t("ui.grpc_method")}
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
            {t("ui.select_a_method")}
          </button>
        )}
        <button
          className={styles.save}
          onClick={() =>
            sendRequestPanelMessage({ action: "saveApiData", data: record })
          }
        >
          {t("ui.save")}
        </button>
        <RequestAction
          label={controller.busy ? t("ui.cancel") : t("ui.invoke")}
          stopping={controller.busy}
          onClick={controller.busy ? controller.cancel : invoke}
        />
      </RequestToolbar>
      <RequestTabs
        activeKey={tab}
        onChange={setTab}
        keepMounted={false}
        label={t("ui.grpc_request_tabs")}
        wrapStyle={{ flex: "0 0 auto", height: "auto" }}
        tabBarExtraContent={
          methodType && <span className={styles.methodType}>{methodType}</span>
        }
        items={[
          { key: "message", label: t("ui.message") },
          {
            key: "metadata",
            label: t("ui.metadata"),
            countParams: {
              dataSource: config.metadata.filter(
                (row) => row.enabled && row.key,
              ),
            },
          },
          { key: "auth", label: t("ui.authorization") },
          { key: "definition", label: t("ui.service_definition") },
          { key: "settings", label: t("ui.settings") },
        ]}
      >
        {controller.error && (
          <div role="alert" className={styles.error}>
            {controller.error}
          </div>
        )}
        <div className={styles.requestContent}>
          {tab === "message" && (
            <>
              <div className={styles.messageToolbar}>
                <span>{method?.requestType ?? t("ui.request_message")}</span>
                <div>
                  <button onClick={() => void editor.current?.formatEditor()}>
                    {t("ui.beautify")}
                  </button>
                  <button
                    disabled={!method || controller.busy}
                    onClick={() =>
                      update({
                        message: JSON.stringify(method!.example, null, 2),
                      })
                    }
                  >
                    {t("ui.use_example_message")}
                  </button>
                </div>
              </div>
              <div
                className={styles.messageEditor}
                role="group"
                aria-label={t("ui.grpc_message_editor")}
                onKeyDown={(event) => {
                  if (
                    (event.metaKey || event.ctrlKey) &&
                    event.key === "Enter"
                  ) {
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
                  <summary>
                    {t("ui.grpc_message_fields", {
                      count: method.fields.length,
                    })}
                  </summary>
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
                      ? t("ui.grpc_stream_open")
                      : t("ui.waiting_for_the_server")}
                  </span>
                  {controller.writable && (
                    <>
                      <button onClick={controller.write}>
                        {t("ui.send_message")}
                      </button>
                      <button
                        className={styles.secondary}
                        onClick={controller.end}
                      >
                        {t("ui.end_streaming")}
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
      </RequestTabs>
      <GrpcResponse controller={controller} />
    </section>
  );
}
