import React from "react";
import type { UIProps } from "./types";

export const List = Object.assign(
  <T,>({
    dataSource = [],
    renderItem,
    header,
    footer,
    children,
    ...props
  }: UIProps & {
    dataSource?: T[];
    renderItem?: (item: T, index: number) => React.ReactNode;
  }) => (
    <div {...props}>
      {header}
      <ul>
        {children ??
          dataSource.map((item: any, index: number) => (
            <React.Fragment key={item.key ?? index}>
              {renderItem?.(item, index)}
            </React.Fragment>
          ))}
      </ul>
      {footer}
    </div>
  ),
  { Item: ({ children, ...props }: UIProps) => <li {...props}>{children}</li> },
);
