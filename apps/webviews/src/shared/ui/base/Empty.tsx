import { useTranslation } from "react-i18next";
import clsx from "clsx";
import type { EmptyProps } from "./types";
import emptyStyles from "./Empty.module.css";

export function Empty({
  imageClassName,
  descriptionClassName,
  footerClassName,

  description,
  image,
  children,
  className,
  style,
}: EmptyProps) {
  const { t } = useTranslation();
  return (
    <div className={clsx(emptyStyles.empty, className)} style={style}>
      {image && <div className={imageClassName}>{image}</div>}
      {description !== false && (
        <div className={clsx(emptyStyles.description, descriptionClassName)}>
          {description ?? t("ui.no_data")}
        </div>
      )}
      {children && <div className={footerClassName}>{children}</div>}
    </div>
  );
}

Empty.PRESENTED_IMAGE_SIMPLE = null;

Empty.PRESENTED_IMAGE_DEFAULT = null;
