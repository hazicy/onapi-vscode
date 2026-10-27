import styles from "./ApisColorPrefixIcon.module.css";
import { FC } from "react";

import clsx from "clsx";

import AppIcon from "@/shared/ui/AppIcon";

const defaultGradientColor = ["#F6504B", "#F98E8B"];

interface Props {
  gradientColor: string[];
  icon: string;
  className?: string;
}

const ApisColorPrefixIcon: FC<Props> = ({ gradientColor, icon, className }) => {
  return (
    <div
      style={{
        background: `linear-gradient(${(gradientColor || defaultGradientColor).join(",")})`,
      }}
      className={clsx(styles.container, className)}
    >
      <AppIcon icon={icon} className={styles.icon} />
    </div>
  );
};

export default ApisColorPrefixIcon;
