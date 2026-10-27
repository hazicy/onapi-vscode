import { Divider, Flex } from "@/shared/ui/base";
import AppIcon from "@/shared/ui/AppIcon";
import styles from "./ResponseSize.module.css";
import type { ApiSendingData } from "@onapi/http-model/requests/types/send";

const groups = [
  [
    ["HTTPVersion", "HTTP Version"],
    ["LocalAddress", "Local Address"],
    ["RemoteAddress", "Remote Address"],
  ],
  [
    ["TLSProtocol", "TLS Protocol"],
    ["CipherName", "Cipher Name"],
  ],
  [
    ["Certificate", "Certificate CN"],
    ["Issuer", "Issuer CN"],
    ["ValidUntil", "Valid Until"],
  ],
] as const;

export default function ResponseNetwork({
  network,
}: {
  network?: ApiSendingData["response"]["network"];
}) {
  const visible = groups
    .map((group) =>
      group.filter(([key]) => {
        const value = network?.[key];
        return value != null && value !== "" && value !== "undefined";
      }),
    )
    .filter((group) => group.length);
  return (
    <Flex
      gap={8}
      style={{ width: 300 }}
      className={`${styles.customProxy} ${styles.flex}`}
    >
      <Flex className={`${styles.iconWrapper} ${styles.flex}`}>
        <AppIcon icon="network" className={styles.icon} />
      </Flex>
      <Flex
        gap={4}
        style={{ width: 0 }}
        flex={1}
        vertical
        className={`${styles.rightWrapper} ${styles.flex}`}
      >
        <span className={styles.name}>Network</span>
        {visible.map((group, index) => (
          <div key={group[0][0]}>
            {index > 0 && <Divider style={{ margin: "8px 0" }} />}
            {group.map(([key, label]) => (
              <Flex
                key={key}
                justify="space-between"
                gap={8}
                style={{ width: "100%" }}
                className={`${styles.desc} ${styles.flex}`}
              >
                <span>{label}</span>
                <span>{network?.[key]}</span>
              </Flex>
            ))}
          </div>
        ))}
      </Flex>
    </Flex>
  );
}
