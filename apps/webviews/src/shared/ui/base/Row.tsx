import type { UIProps } from "./types";
import { Flex } from "./Flex";

export const Row = ({ gutter, children, ...props }: UIProps) => (
  <Flex {...props} wrap gap={Array.isArray(gutter) ? gutter[0] : gutter}>
    {children}
  </Flex>
);
