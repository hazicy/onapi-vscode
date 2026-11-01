import { forwardRef } from "react";
import React from "react";
import type { SpaceProps } from "./types";
import { Flex } from "./Flex";

export const Space = forwardRef<HTMLDivElement, SpaceProps>(
  ({ size = 8, direction, split, children, style, ...props }, ref) => (
    <Flex
      {...props}
      ref={ref}
      gap={Array.isArray(size) ? undefined : size}
      style={{
        ...(Array.isArray(size) ? { columnGap: size[0], rowGap: size[1] } : {}),
        ...style,
      }}
      vertical={direction === "vertical"}
    >
      {React.Children.toArray(children).map((c, i) => (
        <React.Fragment key={i}>
          {i > 0 && split}
          {c}
        </React.Fragment>
      ))}
    </Flex>
  ),
);
