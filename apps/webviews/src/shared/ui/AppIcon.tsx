import { Icon } from "@iconify/react";
import clsx from "clsx";
import { forwardRef } from "react";
import type { HTMLAttributes } from "react";
import { appIcons, type AppIconName } from "./app-icons";
import css from "./AppIcon.module.css";

type AppIconProps = HTMLAttributes<HTMLSpanElement> & {
  icon: string;
  rotate?: number;
  spin?: boolean;
};

const AppIcon = forwardRef<HTMLSpanElement, AppIconProps>(
  ({ icon, rotate, spin, style, className, ...props }, ref) => (
    <span
      {...props}
      ref={ref}
      className={clsx(css.icon, spin && css.spin, className)}
      style={{
        transform: rotate ? `rotate(${rotate}deg)` : undefined,
        ...style,
      }}
    >
      <Icon
        ssr
        icon={
          Object.hasOwn(appIcons, icon)
            ? appIcons[icon as AppIconName]
            : appIcons["circle-help"]
        }
        width="1em"
        height="1em"
        aria-hidden="true"
      />
    </span>
  ),
);

export default AppIcon;
