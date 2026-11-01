import type { RowProps } from "./types";
import { Flex } from "./Flex";

export const Row = ({ gutter, children, style, ...props }: RowProps) => (
  <Flex
    {...props}
    wrap
    style={{
      columnGap: Array.isArray(gutter) ? gutter[0] : gutter,
      rowGap: Array.isArray(gutter) ? gutter[1] : gutter,
      ...style,
    }}
  >
    {children}
  </Flex>
);
