import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation();

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
          <h3>{t("ui.service_definition")}</h3>
          <p>{t("ui.grpc_definition_help")}</p>
        </div>
        <button
          disabled={controller.busy || controller.importing}
          onClick={controller.discover}
        >
          {controller.busy && controller.phase === "discover"
            ? t("ui.loading")
            : t("ui.load_services")}
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
          <strong>{t("ui.server_reflection")}</strong>
          <span>{t("ui.discover_services_directly_from_the_server")}</span>
        </button>
        <button
          aria-pressed={definition.source === "proto"}
          disabled={controller.busy}
          onClick={() => updateFiles([])}
        >
          <strong>{t("ui.protobuf_files")}</strong>
          <span>{t("ui.import_a_proto_file_and_its_dependencies")}</span>
        </button>
      </div>
      {definition.source === "reflection" ? (
        <div className={styles.hint}>{t("ui.grpc_reflection_help")}</div>
      ) : (
        <>
          <div className={styles.toolbar}>
            <button
              disabled={controller.busy || controller.importing}
              onClick={() => controller.importFiles()}
            >
              {t("ui.import_proto")}
            </button>
            <button
              disabled={controller.busy || controller.importing}
              onClick={() => controller.importFiles(true)}
            >
              {t("ui.import_folder")}
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
              {t("ui.new_proto_file")}
            </button>
            <button
              disabled={!file || controller.busy}
              onClick={() =>
                updateFiles(files.filter((item) => item.name !== file?.name))
              }
            >
              {t("ui.remove_file")}
            </button>
            {controller.importing && (
              <span role="status">{t("ui.importing")}</span>
            )}
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
                aria-label={t("ui.proto_definition_editor")}
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
            <div className={styles.hint}>{t("ui.grpc_proto_help")}</div>
          )}
        </>
      )}
      {methods.length > 0 && (
        <div className={styles.loaded}>
          <strong>
            {t("ui.grpc_loaded", {
              services: new Set(methods.map((method) => method.service)).size,
              methods: methods.length,
            })}
          </strong>
          <span>{t("ui.grpc_select_method_help")}</span>
        </div>
      )}
    </div>
  );
}
