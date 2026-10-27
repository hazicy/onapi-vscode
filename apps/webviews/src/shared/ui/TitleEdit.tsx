import styles from "./TitleEdit.module.css";
import { Input } from "@/shared/ui/base";
import classNames from "classnames";
import { FC } from "react";

import { InputProps } from "@/shared/ui/base";

type Props = InputProps;

export const TitleEdit: FC<Props> = ({ ...resetProps }) => {
  return (
    <Input
      {...resetProps}
      className={classNames(styles.container, resetProps.className)}
    />
  );
};

export default TitleEdit;
