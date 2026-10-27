import styles from "./Empty.module.css";
import clsx from "clsx";
import { CSSProperties, FC } from "react";
import { useTranslation } from "react-i18next";

import { Empty as BaseEmpty } from "@/shared/ui/base";
import type { EmptyProps } from "@/shared/ui/base";

import EmptyIllustration from "./EmptyIllustration";
import type { EmptyVariant } from "./EmptyIllustration";

import { openUrl } from "@/shared/utils/open";

type Props = EmptyProps & {
  wrapClassName?: string;
  wrapStyle?: CSSProperties;
  link?: string;
  variant?: EmptyVariant;
  role?: "status" | "alert";
};

const Empty: FC<Props> = ({
  wrapClassName,
  wrapStyle,
  children,
  variant,
  role,
  className,
  descriptionClassName,
  link,
  ...resetProps
}) => {
  const { t } = useTranslation();
  const image = resetProps.image ?? <EmptyIllustration variant={variant} />;
  const description = resetProps.description ?? t("common.nodata");

  return (
    <div
      role={role}
      style={wrapStyle}
      className={clsx(styles.container, wrapClassName)}
    >
      <BaseEmpty
        {...resetProps}
        image={image}
        description={description}
        descriptionClassName={descriptionClassName}
        className={clsx(styles.empty, className)}
      >
        {children}
        {link && <a onClick={() => openUrl(link)}>{t("supplement.doc_use")}</a>}
      </BaseEmpty>
    </div>
  );
};

export default Empty;
