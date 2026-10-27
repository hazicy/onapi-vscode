import styles from "./Empty.module.css";
import { useTranslation } from "react-i18next";

import clsx from "clsx";

import Empty from "@/shared/ui/Empty";
import AppIcon from "@/shared/ui/AppIcon";

type ResponseEmpty = {
  description?: string;
  descriptionClassName?: string;
  maskMode?: boolean;
  wrapClassName?: string;
};

const ResponseEmpty = ({
  description,
  descriptionClassName,
  maskMode = false,
  wrapClassName,
}: ResponseEmpty) => {
  const { t } = useTranslation();
  return (
    <div
      className={clsx(
        styles.container,
        { [styles.maskMode]: maskMode },
        wrapClassName,
      )}
    >
      <Empty
        className={styles.responseEmptyWrap}
        description={description || t("api.run.response_tip")}
        image={<AppIcon icon="onapi" className={styles.iconEmptyWrap} />}
        descriptionClassName={clsx(descriptionClassName, styles.emptyDescription)}
        imageClassName={styles.emptyImage}
      />
    </div>
  );
};

export default ResponseEmpty;
