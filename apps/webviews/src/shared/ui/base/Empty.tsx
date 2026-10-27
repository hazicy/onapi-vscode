import clsx from "clsx";
import type { UIProps } from "./types";
import emptyStyles from "./Empty.module.css";

export function Empty({
  imageClassName,
  descriptionClassName,
  footerClassName,

  description = "No data",
  image,
  children,
  className,
  style,
}: UIProps) {
  return (
    <div className={clsx(emptyStyles.empty, className)} style={style}>
      {image && <div className={imageClassName}>{image}</div>}
      {description !== false && (
        <div className={clsx(emptyStyles.description, descriptionClassName)}>
          {description}
        </div>
      )}
      {children && <div className={footerClassName}>{children}</div>}
    </div>
  );
}

Empty.PRESENTED_IMAGE_SIMPLE = null;

Empty.PRESENTED_IMAGE_DEFAULT = null;
