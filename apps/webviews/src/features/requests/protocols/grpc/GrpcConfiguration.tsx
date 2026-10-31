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
  const rows = config.metadata;
  const edit = (index: number, patch: Partial<(typeof rows)[number]>) =>
    update({
      metadata: rows.map((row, position) =>
        position === index ? { ...row, ...patch } : row,
      ),
    });
  return (
    <div className={styles.configuration}>
      <h3>Request metadata</h3>
      <p>
        Pass key-value pairs with the call. Binary keys ending in -bin use
        base64 values.
      </p>
      <table className={styles.metadataTable}>
        <thead>
          <tr>
            <th aria-label="Enabled" />
            <th>Key</th>
            <th>Value</th>
            <th aria-label="Actions" />
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={index}>
              <td>
                <input
                  type="checkbox"
                  aria-label={`Enable metadata ${index + 1}`}
                  checked={row.enabled}
                  onChange={(e) => edit(index, { enabled: e.target.checked })}
                />
              </td>
              <td>
                <input
                  aria-label={`Metadata key ${index + 1}`}
                  value={row.key}
                  onChange={(e) => edit(index, { key: e.target.value })}
                  placeholder="authorization"
                />
              </td>
              <td>
                <input
                  aria-label={`Metadata value ${index + 1}`}
                  value={row.value}
                  onChange={(e) => edit(index, { value: e.target.value })}
                  placeholder="Value or {{variable}}"
                />
              </td>
              <td>
                <button
                  aria-label={`Remove metadata ${index + 1}`}
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
        + Add metadata
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
  const auth = config.auth;
  const edit = (patch: Partial<GrpcConfig["auth"]>) =>
    update({ auth: { ...auth, ...patch } });
  return (
    <div className={styles.configuration}>
      <h3>Authorization</h3>
      <label>
        Type
        <select
          aria-label="Authorization type"
          value={auth.type}
          onChange={(e) => edit({ type: e.target.value as typeof auth.type })}
        >
          <option value="none">No Auth</option>
          <option value="bearer">Bearer Token</option>
          <option value="basic">Basic Auth</option>
          <option value="apikey">API Key</option>
        </select>
      </label>
      {auth.type === "none" && (
        <p>This call will use the metadata you configured.</p>
      )}
      {auth.type === "bearer" && (
        <label>
          Token
          <input
            type="password"
            autoComplete="off"
            value={auth.token}
            onChange={(e) => edit({ token: e.target.value })}
            placeholder="Token or {{variable}}"
          />
        </label>
      )}
      {auth.type === "basic" && (
        <>
          <label>
            Username
            <input
              value={auth.username}
              onChange={(e) => edit({ username: e.target.value })}
            />
          </label>
          <label>
            Password
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
            Key
            <input
              value={auth.key}
              onChange={(e) => edit({ key: e.target.value })}
            />
          </label>
          <label>
            Value
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
  const editTls = (patch: Partial<GrpcConfig["tls"]>) =>
    update({ tls: { ...config.tls, ...patch } });
  return (
    <div className={styles.configuration}>
      <h3>Call settings</h3>
      <label>
        Deadline (ms)
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
        <small>
          0 keeps the call open until it completes or you cancel it.
        </small>
      </label>
      <label>
        Maximum response message size (bytes)
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
        <small>0 removes the message size limit.</small>
      </label>
      <label className={styles.check}>
        <input
          type="checkbox"
          checked={config.includeDefaults}
          onChange={(e) => update({ includeDefaults: e.target.checked })}
        />
        Include fields with default values in responses
      </label>
      <h3>TLS certificates</h3>
      <label>
        Server name override
        <input
          value={config.tls.serverName}
          onChange={(e) => editTls({ serverName: e.target.value })}
          placeholder="Optional hostname for certificate verification"
        />
      </label>
      <label>
        Root CA certificate (PEM)
        <textarea
          value={config.tls.rootCertificates}
          onChange={(e) => editTls({ rootCertificates: e.target.value })}
          placeholder="Use system certificate authorities when empty"
        />
      </label>
      <label>
        Client certificate (PEM)
        <textarea
          value={config.tls.clientCertificate}
          onChange={(e) => editTls({ clientCertificate: e.target.value })}
        />
      </label>
      <label>
        Client private key (PEM)
        <textarea
          value={config.tls.privateKey}
          onChange={(e) => editTls({ privateKey: e.target.value })}
        />
      </label>
    </div>
  );
}
