import { useCallback, useLayoutEffect, type RefObject } from "react";
import type { TextAreaProps } from "./types";

export function useTextareaAutosize(
  ref: RefObject<HTMLTextAreaElement | null>,
  autoSize: TextAreaProps["autoSize"],
  rows: number,
  value: TextAreaProps["value"],
) {
  const enabled = Boolean(autoSize);
  const minRows =
    typeof autoSize === "object" ? (autoSize.minRows ?? rows) : rows;
  const maxRows = typeof autoSize === "object" ? autoSize.maxRows : undefined;
  const resize = useCallback(() => {
    const input = ref.current;
    if (!enabled || !input) {
      return;
    }
    const css = getComputedStyle(input);
    const lineHeight =
      parseFloat(css.lineHeight) || parseFloat(css.fontSize) * 1.2;
    const padding = parseFloat(css.paddingTop) + parseFloat(css.paddingBottom);
    const border =
      parseFloat(css.borderTopWidth) + parseFloat(css.borderBottomWidth);
    const extra = css.boxSizing === "border-box" ? padding + border : 0;
    const min = Math.max(1, minRows) * lineHeight + extra;
    const max =
      maxRows === undefined
        ? Infinity
        : Math.max(minRows, maxRows) * lineHeight + extra;
    input.style.height = "0px";
    const natural = input.scrollHeight - padding + extra;
    input.style.height = `${Math.min(max, Math.max(min, natural))}px`;
    input.style.overflowY = natural > max ? "auto" : "hidden";
  }, [ref, enabled, minRows, maxRows]);

  useLayoutEffect(() => {
    const input = ref.current;
    if (!enabled || !input) {
      return;
    }
    const { height, overflowY } = input.style;
    return () => {
      input.style.height = height;
      input.style.overflowY = overflowY;
    };
  }, [ref, enabled]);

  useLayoutEffect(() => {
    resize();
  }, [resize, value]);

  useLayoutEffect(() => {
    const input = ref.current;
    if (!enabled || !input) {
      return;
    }
    // Resize when a panel changes width, without observing our own height changes.
    let width = input.clientWidth;
    const observer = new ResizeObserver(() => {
      if (input.clientWidth !== width) {
        width = input.clientWidth;
        resize();
      }
    });
    observer.observe(input);
    return () => observer.disconnect();
  }, [ref, enabled, resize]);

  return resize;
}
