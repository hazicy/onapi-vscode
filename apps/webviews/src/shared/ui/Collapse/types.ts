import type { CollapseProps as BaseCollapseProps } from "@/shared/ui/base";

export type CollapseProps = {
  /**header background color */
  headerBg?: string;
  /**ItemBottom */
  marginBottom?: number;
  /**borderRadius */
  borderRadius?: number;
  /**headerPadding */
  headerPadding?: string;
} & BaseCollapseProps;
