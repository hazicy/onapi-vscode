import styles from "./Tag.module.css";
import { hexToRGBA } from "@/shared/utils/common";

import { TAG_TYPE_MAP } from "./constants";
import { TagType } from "./types";

const Tag = ({ type }: { type: TagType }) => {
  const { color, name } = TAG_TYPE_MAP[type] || {};

  return (
    <div
      style={{
        background: color && hexToRGBA(color, 0.1),
        color,
      }}
      className={styles.container}
    >
      {name}
    </div>
  );
};

export default Tag;
