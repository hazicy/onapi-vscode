import NoData from "@/shared/assets/empty/no-data.svg?react";
import NoResults from "@/shared/assets/empty/no-results.svg?react";
import Request from "@/shared/assets/empty/request.svg?react";
import Connection from "@/shared/assets/empty/connection.svg?react";
import NoHistory from "@/shared/assets/empty/no-history.svg?react";
import NoCollections from "@/shared/assets/empty/no-collections.svg?react";
import ErrorIllustration from "@/shared/assets/empty/error.svg?react";
import styles from "./EmptyIllustration.module.css";

const illustrations = {
  "no-data": NoData,
  "no-results": NoResults,
  request: Request,
  error: ErrorIllustration,
  connection: Connection,
  "no-history": NoHistory,
  "no-collections": NoCollections,
};

export type EmptyVariant = keyof typeof illustrations;

export default function EmptyIllustration({
  variant = "no-data",
}: {
  variant?: EmptyVariant;
}) {
  const Illustration = illustrations[variant];
  return (
    <Illustration
      className={styles.scene}
      aria-hidden="true"
      role="presentation"
    />
  );
}
