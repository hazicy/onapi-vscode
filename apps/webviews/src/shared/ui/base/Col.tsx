import type { ColProps } from "./types";

export const Col = ({ span = 24, offset = 0, style, ...props }: ColProps) => (
  <div
    {...props}
    style={{
      width: `${(span / 24) * 100}%`,
      marginLeft: `${(offset / 24) * 100}%`,
      ...style,
    }}
  />
);
