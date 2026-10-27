import styles from "./Empty.module.css";
import clsx from "clsx";
import { CSSProperties, FC } from "react";
import { useTranslation } from "react-i18next";

import { Empty as AntEmpty } from "@/shared/ui/base";
import type { EmptyProps } from "@/shared/ui/base";

import EmptyIcon from "@/shared/assets/icon/empty.svg?react";

import { openUrl } from "@/shared/utils/open";

type Props = EmptyProps & {
  wrapClassName?: string;
  wrapStyle?: CSSProperties;
  link?: string;
};

const Empty: FC<Props> = ({
  wrapClassName,
  wrapStyle,
  children,
  ...resetProps
}) => {
  const { t } = useTranslation();
  const image = resetProps.image || <EmptyIcon />;
  const description = resetProps.description || t("common.nodata");
  const link = resetProps.link || "";

  return (
    <div
      style={wrapStyle}
      className={clsx(styles.container, wrapClassName)}
    >
      <AntEmpty
        {...resetProps}
        image={image}
        description={description}
        descriptionClassName={styles.emptyDescription}
        className={styles.empty}
      >
        {children}
        {link && <a onClick={() => openUrl(link)}>{t("supplement.doc_use")}</a>}
      </AntEmpty>
    </div>
  );
};

export default Empty;
