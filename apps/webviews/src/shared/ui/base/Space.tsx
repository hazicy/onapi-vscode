import { forwardRef } from "react";
import React from "react";
import type { SpaceProps } from "./types";
import { Flex } from "./Flex";

export const Space = Object.assign(
  forwardRef<HTMLDivElement, SpaceProps>(
    ({ size = 8, direction, split, children, ...props }, ref) => (
      <Flex
        {...props}
        ref={ref}
        gap={Array.isArray(size) ? size[0] : size}
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
  ),
  { Compact: Flex },
);
