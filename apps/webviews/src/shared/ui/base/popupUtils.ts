import React from "react";

export const placement = (p = "top") => ({
  side: (p.startsWith("bottom")
    ? "bottom"
    : p.startsWith("left")
      ? "left"
      : p.startsWith("right")
        ? "right"
        : "top") as "top" | "bottom" | "left" | "right",
  align: (/Left|Top/.test(p)
    ? "start"
    : /Right|Bottom/.test(p)
      ? "end"
      : "center") as "start" | "end" | "center",
});

export const node = (children: React.ReactNode) =>
  React.isValidElement(children)
    ? children
    : React.createElement("span", null, children);

export const content = (value: any) =>
  typeof value === "function" ? value() : value;
