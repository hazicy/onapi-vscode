import React from "react";
import type { DOMProps } from "./types";

export const List = Object.assign(
  <T,>({
    dataSource = [],
    renderItem,
    header,
    footer,
    children,
    ...props
  }: DOMProps & {
    header?: React.ReactNode;
    footer?: React.ReactNode;
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
  {
    Item: ({ children, ...props }: DOMProps) => <li {...props}>{children}</li>,
  },
);
