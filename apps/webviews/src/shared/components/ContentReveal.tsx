import type { ReactNode } from "react";
import styles from "./ContentReveal.module.css";

/** Animate the mounted content, preserving its available panel space. */
export default function ContentReveal({ children }: { children: ReactNode }) {
  return <div className={styles.content}>{children}</div>;
}
