import type { RowProps } from "./types";
import { Flex } from "./Flex";

export const Row = ({ gutter, children, ...props }: RowProps) => (
  <Flex {...props} wrap gap={Array.isArray(gutter) ? gutter[0] : gutter}>
    {children}
  </Flex>
);
