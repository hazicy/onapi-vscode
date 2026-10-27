import { forwardRef } from "react";
import React from "react";
import clsx from "clsx";
import type { TypographyProps } from "./types";
import typographyStyles from "./Typography.module.css";
import { Tag } from "./Tag";

const Text = forwardRef<HTMLSpanElement, TypographyProps>(
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
        ref={ref}
        title={
          typeof ellipsis === "object" && ellipsis.tooltip
            ? String(children)
            : props.title
        }
        className={clsx(
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
  ({ children, ...props }: TypographyProps) => <div {...props}>{children}</div>,
  {
    Text,
    Paragraph: forwardRef<HTMLParagraphElement, TypographyProps>(
      (props, ref) => (
        <p {...props} ref={ref}>
          <Text {...props} />
        </p>
      ),
    ),
    Title: ({
      level = 1,
      ...props
    }: TypographyProps & { level?: 1 | 2 | 3 | 4 | 5 }) =>
      React.createElement(`h${level}`, props),
    Link: forwardRef<
      HTMLAnchorElement,
      React.AnchorHTMLAttributes<HTMLAnchorElement>
    >((props, ref) => <a {...props} ref={ref} />),
  },
);
