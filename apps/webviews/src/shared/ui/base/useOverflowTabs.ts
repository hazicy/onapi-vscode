import { useLayoutEffect, useRef, useState } from "react";

/** Measure the real tab labels, including counters and adjacent controls. */
export function useOverflowTabs(
  keys: string[],
  current: string | undefined,
  enabled: boolean,
) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const moreRef = useRef<HTMLButtonElement>(null);
  const [visibleKeys, setVisibleKeys] = useState<string[] | null>(null);
  const signature = JSON.stringify(keys);

  useLayoutEffect(() => {
    if (!enabled) {
      return;
    }
    const wrap = wrapRef.current;
    const list = listRef.current;
    const more = moreRef.current;
    if (!wrap || !list || !more) {
      return;
    }
    const measure = () => {
      const tabs = Array.from(list.children) as HTMLElement[];
      const widths = tabs.map((tab) => tab.getBoundingClientRect().width);
      const gap = Number.parseFloat(getComputedStyle(list).columnGap) || 0;
      const available = wrap.clientWidth;
      const total =
        widths.reduce((sum, width) => sum + width, 0) +
        Math.max(0, widths.length - 1) * gap;
      let next = keys;
      if (total > available) {
        const budget = Math.max(
          0,
          available - more.getBoundingClientRect().width - gap,
        );
        const active = keys.indexOf(current || "");
        const chosen = new Set<number>();
        let used = 0;
        if (active >= 0) {
          chosen.add(active);
          used = widths[active];
        }
        for (let index = 0; index < keys.length; index++) {
          if (index === active) {
            continue;
          }
          const needed = widths[index] + (chosen.size ? gap : 0);
          if (used + needed > budget) {
            break;
          }
          chosen.add(index);
          used += needed;
        }
        next = keys.filter((_, index) => chosen.has(index));
      }
      setVisibleKeys((previous) =>
        previous?.join("\0") === next.join("\0") ? previous : next,
      );
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(wrap);
    observer.observe(list);
    observer.observe(more);
    for (const tab of Array.from(list.children)) {
      observer.observe(tab);
    }
    return () => observer.disconnect();
  }, [signature, current, enabled]);

  return {
    wrapRef,
    listRef,
    moreRef,
    visibleKeys: enabled ? visibleKeys : null,
  };
}
