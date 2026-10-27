import { forwardRef } from "./forwardRef";
import React from "react";
import cx from "classnames";
import type { UIProps } from "./types";
import flexStyles from "./Flex.module.css";

export const Flex = forwardRef<HTMLDivElement, UIProps>(
  (
    {
      vertical,
      align,
      justify,
      gap,
      wrap,
      flex,
      component = "div",
      children,
      className,
      rootClassName,
      style,
      ...props
    },
    ref,
  ) =>
    React.createElement(
      component,
      {
        ...props,
        ref,
        className: cx(flexStyles.flex, className, rootClassName),
        style: {
          flexDirection: vertical ? "column" : "row",
          alignItems: align,
          justifyContent: justify,
          gap:
            typeof gap === "number"
              ? gap
              : gap === "small"
                ? 8
                : gap === "middle"
                  ? 16
                  : gap === "large"
                    ? 24
                    : gap,
          flexWrap: wrap === true ? "wrap" : wrap,
          flex,
          ...style,
        },
      },
      children,
    ),
);
