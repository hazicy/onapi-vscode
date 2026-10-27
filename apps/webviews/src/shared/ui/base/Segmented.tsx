import segmentedStyles from "./Segmented.module.css";
import { Tabs as BaseTabs } from "@base-ui/react/tabs";
import clsx from "clsx";
import type { SegmentedProps } from "./types";

export function Segmented<V extends string | number = string | number>({
  activeItemClassName,
  listClassName,
  itemClassName,
  labelClassName,

  options = [],
  value,
  defaultValue,
  onChange,
  className,
  ...props
}: SegmentedProps<V>) {
  return (
    <BaseTabs.Root
      {...props}
      value={value}
      defaultValue={
        defaultValue ??
        (typeof options[0] === "object"
          ? (options[0] as any).value
          : options[0])
      }
      onValueChange={(v) => onChange?.(v as V)}
      className={clsx(segmentedStyles.segmented, className)}
    >
      <BaseTabs.List className={clsx(segmentedStyles.tabList, listClassName)}>
        {options.map((raw: any) => {
          const o = typeof raw === "object" ? raw : { value: raw, label: raw };
          return (
            <BaseTabs.Tab
              key={o.value}
              value={o.value}
              disabled={o.disabled}
              className={(state) =>
                clsx(
                  segmentedStyles.tab,
                  itemClassName,
                  state.active && activeItemClassName,
                )
              }
            >
              <span className={labelClassName}>
                {o.icon}
                {o.label}
              </span>
            </BaseTabs.Tab>
          );
        })}
      </BaseTabs.List>
    </BaseTabs.Root>
  );
}
