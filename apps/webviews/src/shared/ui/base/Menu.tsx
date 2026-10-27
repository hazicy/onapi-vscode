import { useState } from "react";
import cx from "classnames";
import menuStyles from "./Menu.module.css";
import type { MenuProps, MenuItemProps } from "./types";

export function Menu({
  itemClassName,
  selectedItemClassName,

  items = [],
  onClick,
  selectedKeys = [],
  className,
  ...props
}: MenuProps) {
  const [expanded, setExpanded] = useState<string[]>(
    props.defaultOpenKeys ?? [],
  );
  const render = (rows: MenuItemProps[]) => (
    <ul role="menu" className={cx(menuStyles.menu, className)}>
      {rows.map((item, index) => (
        <li key={String(item.key ?? index)} role="none">
          {item.type === "divider" ? (
            <hr />
          ) : (
            <button
              type="button"
              role="menuitem"
              disabled={item.disabled}
              className={cx(
                menuStyles.item,
                itemClassName,
                selectedKeys.includes(String(item.key)) &&
                  selectedItemClassName,
              )}
              onClick={(e) => {
                if (item.children) {
                  setExpanded((v) =>
                    v.includes(String(item.key))
                      ? v.filter((k) => k !== String(item.key))
                      : [...v, String(item.key)],
                  );
                } else {
                  const info = {
                    key: String(item.key),
                    keyPath: [String(item.key)],
                    domEvent: e,
                  };
                  item.onClick?.(info);
                  onClick?.(info);
                }
              }}
            >
              {item.icon}
              {item.label}
            </button>
          )}
          {item.children &&
            expanded.includes(String(item.key)) &&
            render(item.children)}
        </li>
      ))}
    </ul>
  );
  return render(items ?? []);
}
