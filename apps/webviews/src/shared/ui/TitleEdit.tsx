import styles from "./TitleEdit.module.css";
import { Input } from "@/shared/ui/base";
import clsx from "clsx";
import { FC } from "react";

import { InputProps } from "@/shared/ui/base";

type Props = InputProps;

export const TitleEdit: FC<Props> = ({ ...resetProps }) => {
  return (
    <Input
      {...resetProps}
      className={clsx(styles.container, resetProps.className)}
    />
  );
};

export default TitleEdit;
