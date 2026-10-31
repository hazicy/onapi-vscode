import { useState } from "react";
import type { GrpcConfig, GrpcProtoFile } from "@onapi/domain/requests/grpc";
import CodeEditor from "@/shared/components/CodeEditor/CodeEditor";
import type { GrpcConfigChange, GrpcController } from "./useGrpc";
import styles from "./GrpcDebug.module.css";

export function GrpcDefinition({
  config,
  update,
  controller,
}: {
  config: GrpcConfig;
  update: GrpcConfigChange;
  controller: GrpcController;
}) {
  const [selectedFile, setSelectedFile] = useState("");
  const definition = config.definition;
  const files = definition.source === "proto" ? definition.files : [];
  const file = files.find((file) => file.name === selectedFile) ?? files[0];
  const updateFiles = (files: GrpcProtoFile[]) =>
    update({ definition: { source: "proto", files }, method: "" });
  const methods = controller.methods;
  return (
    <div className={styles.definition}>
      <div className={styles.sectionTitle}>
        <div>
          <h3>Service definition</h3>
          <p>
            Load services and message types from your server or Protocol Buffers
            files.
          </p>
        </div>
        <button
          disabled={controller.busy || controller.importing}
          onClick={controller.discover}
        >
          {controller.busy && controller.phase === "discover"
            ? "Loading…"
            : "Load services"}
        </button>
      </div>
      <div className={styles.sourceOptions}>
        <button
          aria-pressed={definition.source === "reflection"}
          disabled={controller.busy}
          onClick={() =>
            update({ definition: { source: "reflection" }, method: "" })
          }
        >
          <strong>Server reflection</strong>
          <span>Discover services directly from the server</span>
        </button>
        <button
          aria-pressed={definition.source === "proto"}
          disabled={controller.busy}
          onClick={() => updateFiles([])}
        >
          <strong>Protobuf files</strong>
          <span>Import a .proto file and its dependencies</span>
        </button>
      </div>
      {definition.source === "reflection" ? (
        <div className={styles.hint}>
          Enter the server address and select <strong>Load services</strong>. If
          the server does not support reflection, import its .proto definition.
        </div>
      ) : (
        <>
          <div className={styles.toolbar}>
            <button
              disabled={controller.busy || controller.importing}
              onClick={() => controller.importFiles()}
            >
              Import .proto
            </button>
            <button
              disabled={controller.busy || controller.importing}
              onClick={() => controller.importFiles(true)}
            >
              Import folder
            </button>
            <button
              disabled={controller.busy}
              onClick={() => {
                let name = "service.proto";
                let suffix = 1;
                while (files.some((file) => file.name === name)) {
                  name = `service-${suffix++}.proto`;
                }
                updateFiles([
                  ...files,
                  {
                    name,
                    content:
                      'syntax = "proto3";\npackage example;\n\nmessage Request { string name = 1; }\nmessage Reply { string message = 1; }\nservice Greeter { rpc SayHello(Request) returns (Reply); }\n',
                  },
                ]);
                setSelectedFile(name);
              }}
            >
              New proto file
            </button>
            <button
              disabled={!file || controller.busy}
              onClick={() =>
                updateFiles(files.filter((item) => item.name !== file?.name))
              }
            >
              Remove file
            </button>
            {controller.importing && <span role="status">Importing…</span>}
          </div>
          {file ? (
            <>
              <div className={styles.fileTabs}>
                {files.map((item) => (
                  <button
                    key={item.name}
                    aria-pressed={file.name === item.name}
                    onClick={() => setSelectedFile(item.name)}
                  >
                    {item.name}
                  </button>
                ))}
              </div>
              <div
                className={styles.protoEditor}
                role="group"
                aria-label="Proto definition editor"
              >
                <CodeEditor
                  value={file.content}
                  language="protobuf"
                  onMountAutoFormat={false}
                  readOnly={controller.busy || controller.importing}
                  onChange={(content) =>
                    updateFiles(
                      files.map((item) =>
                        item.name === file.name ? { ...item, content } : item,
                      ),
                    )
                  }
                />
              </div>
            </>
          ) : (
            <div className={styles.hint}>
              Import a .proto file to get started. Local imports are included
              automatically and saved with the request.
            </div>
          )}
        </>
      )}
      {methods.length > 0 && (
        <div className={styles.loaded}>
          <strong>
            {new Set(methods.map((method) => method.service)).size} services ·{" "}
            {methods.length} methods loaded
          </strong>
          <span>
            Select a method in the request bar to compose its message.
          </span>
        </div>
      )}
    </div>
  );
}
