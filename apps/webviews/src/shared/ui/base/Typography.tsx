import { forwardRef } from "./forwardRef";
import React from "react";
import cx from "classnames";
import type { UIProps } from "./types";
import typographyStyles from "./Typography.module.css";
import { Tag } from "./Tag";

const Text = forwardRef<HTMLElement, UIProps>(
  (
    {
      children,
      ellipsis,
      copyable,
      editable,
      type,
      strong,
      code,
      underline,
      delete: deleted,
      disabled,
      className,
      style,
      ...props
    },
    ref,
  ) => {
    const Tag = code ? "code" : strong ? "strong" : "span";
    return (
      <Tag
        {...props}
        ref={ref as any}
        title={
          typeof ellipsis === "object" && ellipsis.tooltip
            ? String(children)
            : props.title
        }
        className={cx(
          ellipsis && typographyStyles.ellipsis,
          type && typographyStyles[type as keyof typeof typographyStyles],
          className,
        )}
        style={style}
      >
        {children}
      </Tag>
    );
  },
);

export const Typography = Object.assign(
  ({ children, ...props }: UIProps) => <div {...props}>{children}</div>,
  {
    Text,
    Paragraph: forwardRef<HTMLParagraphElement, UIProps>((props, ref) => (
      <p {...props} ref={ref}>
        <Text {...props} />
      </p>
    )),
    Title: ({ level = 1, ...props }: UIProps) =>
      React.createElement(`h${level}`, props),
    Link: forwardRef<HTMLAnchorElement, UIProps>((props, ref) => (
      <a {...props} ref={ref} />
    )),
  },
);
