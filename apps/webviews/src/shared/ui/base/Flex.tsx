import { forwardRef } from "react";
import React from "react";
import clsx from "clsx";
import type { FlexProps } from "./types";
import flexStyles from "./Flex.module.css";

export const Flex = forwardRef<HTMLDivElement, FlexProps>(
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
        className: clsx(flexStyles.flex, className, rootClassName),
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
