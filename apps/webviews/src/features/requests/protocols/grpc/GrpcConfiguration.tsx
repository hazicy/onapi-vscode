import { useTranslation } from "react-i18next";
import type { GrpcConfig } from "@onapi/domain/requests/grpc";
import type { GrpcConfigChange } from "./useGrpc";
import styles from "./GrpcDebug.module.css";

export function GrpcMetadata({
  config,
  update,
}: {
  config: GrpcConfig;
  update: GrpcConfigChange;
}) {
  const { t } = useTranslation();

  const rows = config.metadata;
  const edit = (index: number, patch: Partial<(typeof rows)[number]>) =>
    update({
      metadata: rows.map((row, position) =>
        position === index ? { ...row, ...patch } : row,
      ),
    });
  return (
    <div className={styles.configuration}>
      <h3>{t("ui.request_metadata")}</h3>
      <p>{t("ui.grpc_metadata_help")}</p>
      <table className={styles.metadataTable}>
        <thead>
          <tr>
            <th aria-label={t("ui.enabled")} />
            <th>{t("ui.key")}</th>
            <th>{t("ui.value")}</th>
            <th aria-label={t("ui.actions")} />
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={index}>
              <td>
                <input
                  type="checkbox"
                  aria-label={t("ui.grpc_enable_metadata", {
                    index: index + 1,
                  })}
                  checked={row.enabled}
                  onChange={(e) => edit(index, { enabled: e.target.checked })}
                />
              </td>
              <td>
                <input
                  aria-label={t("ui.grpc_metadata_key", { index: index + 1 })}
                  value={row.key}
                  onChange={(e) => edit(index, { key: e.target.value })}
                  placeholder="authorization"
                />
              </td>
              <td>
                <input
                  aria-label={t("ui.grpc_metadata_value", { index: index + 1 })}
                  value={row.value}
                  onChange={(e) => edit(index, { value: e.target.value })}
                  placeholder={t("ui.value_or_variable", {
                    variable: "{{variable}}",
                  })}
                />
              </td>
              <td>
                <button
                  aria-label={t("ui.grpc_remove_metadata", {
                    index: index + 1,
                  })}
                  onClick={() =>
                    update({
                      metadata: rows.filter(
                        (_, position) => position !== index,
                      ),
                    })
                  }
                >
                  ×
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <button
        className={styles.secondary}
        onClick={() =>
          update({ metadata: [...rows, { key: "", value: "", enabled: true }] })
        }
      >
        {t("ui.add_metadata")}
      </button>
    </div>
  );
}
export function GrpcAuthorization({
  config,
  update,
}: {
  config: GrpcConfig;
  update: GrpcConfigChange;
}) {
  const { t } = useTranslation();

  const auth = config.auth;
  const edit = (patch: Partial<GrpcConfig["auth"]>) =>
    update({ auth: { ...auth, ...patch } });
  return (
    <div className={styles.configuration}>
      <h3>{t("ui.authorization")}</h3>
      <label>
        {t("ui.type")}
        <select
          aria-label={t("ui.authorization_type")}
          value={auth.type}
          onChange={(e) => edit({ type: e.target.value as typeof auth.type })}
        >
          <option value="none">{t("ui.no_auth")}</option>
          <option value="bearer">Bearer Token</option>
          <option value="basic">{t("ui.basic_auth")}</option>
          <option value="apikey">API Key</option>
        </select>
      </label>
      {auth.type === "none" && (
        <p>{t("ui.this_call_will_use_the_metadata_you_configured")}</p>
      )}
      {auth.type === "bearer" && (
        <label>
          Token
          <input
            type="password"
            autoComplete="off"
            value={auth.token}
            onChange={(e) => edit({ token: e.target.value })}
            placeholder={t("ui.token_or_variable", {
              variable: "{{variable}}",
            })}
          />
        </label>
      )}
      {auth.type === "basic" && (
        <>
          <label>
            {t("ui.username")}
            <input
              value={auth.username}
              onChange={(e) => edit({ username: e.target.value })}
            />
          </label>
          <label>
            {t("ui.password")}
            <input
              type="password"
              autoComplete="off"
              value={auth.password}
              onChange={(e) => edit({ password: e.target.value })}
            />
          </label>
        </>
      )}
      {auth.type === "apikey" && (
        <>
          <label>
            {t("ui.key")}
            <input
              value={auth.key}
              onChange={(e) => edit({ key: e.target.value })}
            />
          </label>
          <label>
            {t("ui.value")}
            <input
              type="password"
              autoComplete="off"
              value={auth.value}
              onChange={(e) => edit({ value: e.target.value })}
            />
          </label>
        </>
      )}
    </div>
  );
}
export function GrpcSettings({
  config,
  update,
}: {
  config: GrpcConfig;
  update: GrpcConfigChange;
}) {
  const { t } = useTranslation();

  const editTls = (patch: Partial<GrpcConfig["tls"]>) =>
    update({ tls: { ...config.tls, ...patch } });
  return (
    <div className={styles.configuration}>
      <h3>{t("ui.call_settings")}</h3>
      <label>
        {t("ui.deadline_ms")}
        <input
          type="number"
          min="0"
          max="2147483647"
          value={config.deadlineMs}
          onChange={(e) => {
            const value = Number(e.target.value);
            if (Number.isInteger(value) && value >= 0 && value <= 2147483647) {
              update({ deadlineMs: value });
            }
          }}
        />
        <small>{t("ui.grpc_deadline_help")}</small>
      </label>
      <label>
        {t("ui.grpc_message_limit")}
        <input
          type="number"
          min="0"
          max="2147483647"
          value={config.maxReceiveMessageBytes}
          onChange={(e) => {
            const value = Number(e.target.value);
            if (Number.isInteger(value) && value >= 0 && value <= 2147483647) {
              update({ maxReceiveMessageBytes: value });
            }
          }}
        />
        <small>{t("ui.grpc_message_limit_help")}</small>
      </label>
      <label className={styles.check}>
        <input
          type="checkbox"
          checked={config.includeDefaults}
          onChange={(e) => update({ includeDefaults: e.target.checked })}
        />
        {t("ui.grpc_include_defaults")}
      </label>
      <h3>{t("ui.tls_certificates")}</h3>
      <label>
        {t("ui.server_name_override")}
        <input
          value={config.tls.serverName}
          onChange={(e) => editTls({ serverName: e.target.value })}
          placeholder={t("ui.grpc_server_name_placeholder")}
        />
      </label>
      <label>
        {t("ui.root_ca_certificate_pem")}
        <textarea
          value={config.tls.rootCertificates}
          onChange={(e) => editTls({ rootCertificates: e.target.value })}
          placeholder={t("ui.grpc_ca_placeholder")}
        />
      </label>
      <label>
        {t("ui.client_certificate_pem")}
        <textarea
          value={config.tls.clientCertificate}
          onChange={(e) => editTls({ clientCertificate: e.target.value })}
        />
      </label>
      <label>
        {t("ui.client_private_key_pem")}
        <textarea
          value={config.tls.privateKey}
          onChange={(e) => editTls({ privateKey: e.target.value })}
        />
      </label>
    </div>
  );
}
