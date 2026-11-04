import { useTranslation } from "react-i18next";
import clsx from "clsx";

import dropdownStyles from "./Dropdown.module.css";
import { ContextMenu as BaseContextMenu } from "@base-ui/react/context-menu";
import { Menu as BaseMenu } from "@base-ui/react/menu";
import type { DropdownProps, MenuProps } from "./types";
import { Button } from "./Button";

import { placement } from "./popupUtils";
import { node } from "./popupUtils";

function MenuItems({
  itemClassName,
  popupClassName,
  selectedItemClassName,
  items = [],
  onClick,
  selectedKeys = [],
}: MenuProps) {
  return (
    <>
      {items.map((item, index) =>
        item?.type === "divider" ? (
          <BaseMenu.Separator
            key={index}
            className={dropdownStyles.separator}
          />
        ) : item?.type === "group" ? (
          <BaseMenu.Group key={String(item.key ?? index)}>
            <BaseMenu.GroupLabel className={dropdownStyles.menuGroup}>
              {item.label}
            </BaseMenu.GroupLabel>
            <MenuItems
              items={item.children ?? []}
              itemClassName={itemClassName}
              selectedItemClassName={selectedItemClassName}
              popupClassName={popupClassName}
              onClick={onClick}
              selectedKeys={selectedKeys}
            />
          </BaseMenu.Group>
        ) : item?.children ? (
          <BaseMenu.SubmenuRoot key={String(item.key ?? index)}>
            <BaseMenu.SubmenuTrigger
              className={clsx(
                dropdownStyles.menuItem,
                itemClassName,
                item.className,
              )}
              disabled={item.disabled}
            >
              {item.icon}
              {item.label}
              <span>›</span>
            </BaseMenu.SubmenuTrigger>
            <BaseMenu.Portal>
              <BaseMenu.Positioner
                className={dropdownStyles.positioner}
                sideOffset={2}
              >
                <BaseMenu.Popup
                  className={clsx(dropdownStyles.popup, popupClassName)}
                >
                  <MenuItems
                    items={item.children ?? []}
                    itemClassName={itemClassName}
                    selectedItemClassName={selectedItemClassName}
                    popupClassName={popupClassName}
                    onClick={onClick}
                    selectedKeys={selectedKeys}
                  />
                </BaseMenu.Popup>
              </BaseMenu.Positioner>
            </BaseMenu.Portal>
          </BaseMenu.SubmenuRoot>
        ) : (
          <BaseMenu.Item
            key={String(item?.key ?? index)}
            disabled={item?.disabled}
            className={clsx(
              dropdownStyles.menuItem,
              itemClassName,
              selectedKeys.includes(String(item?.key)) &&
                clsx(dropdownStyles.menuItemSelected, selectedItemClassName),
              item?.className,
            )}
            style={item?.style}
            onClick={(event) => {
              const info = {
                key: String(item?.key ?? index),
                keyPath: [String(item?.key ?? index)],
                domEvent: event,
              };
              item?.onClick?.(info);
              onClick?.(info);
            }}
          >
            {item?.icon}
            {item?.label}
          </BaseMenu.Item>
        ),
      )}
    </>
  );
}

export function Dropdown({
  children,
  nativeButton = true,
  menu,
  open,
  defaultOpen,
  onOpenChange,
  trigger = ["hover"],
  placement: position = "bottomLeft",
  popupRender,
  overlay,
  itemClassName,
  selectedItemClassName,
  popupClassName,
  popupStyle,
  disabled,
  keepMounted = false,
  ...rest
}: DropdownProps) {
  if (disabled) {
    return children;
  }
  const context = trigger.includes("contextMenu");
  const Root = context ? BaseContextMenu.Root : BaseMenu.Root;
  const body = (
    <BaseMenu.Popup
      className={clsx(dropdownStyles.popup, popupClassName)}
      style={popupStyle}
    >
      {overlay ?? (
        <MenuItems
          {...menu}
          itemClassName={itemClassName}
          selectedItemClassName={selectedItemClassName}
          popupClassName={popupClassName}
        />
      )}
    </BaseMenu.Popup>
  );
  return (
    <Root
      open={open}
      defaultOpen={defaultOpen}
      onOpenChange={(v: boolean, d: { reason: string }) =>
        onOpenChange?.(v, {
          source: d.reason === "item-press" ? "menu" : "trigger",
        })
      }
    >
      {context ? (
        <BaseContextMenu.Trigger {...rest} render={node(children)} />
      ) : (
        <BaseMenu.Trigger
          {...rest}
          render={node(children)}
          nativeButton={nativeButton}
          openOnHover={trigger.includes("hover")}
        />
      )}
      <BaseMenu.Portal keepMounted={keepMounted}>
        <BaseMenu.Positioner
          {...placement(position)}
          sideOffset={4}
          className={dropdownStyles.positioner}
        >
          {popupRender ? popupRender(body) : body}
        </BaseMenu.Positioner>
      </BaseMenu.Portal>
    </Root>
  );
}

Dropdown.Button = ({
  children,
  onClick,
  type,
  loading,
  disabled,
  className,
  style,
  size,
  icon,
  ...props
}: DropdownProps &
  Pick<
    import("./types").ButtonProps,
    "type" | "size" | "loading" | "icon"
  >) => {
  const { t } = useTranslation();
  return (
    <div className={clsx(dropdownStyles.splitButton, className)} style={style}>
      <Button
        type={type}
        size={size}
        loading={loading}
        disabled={disabled}
        onClick={onClick}
      >
        {children}
      </Button>
      <Dropdown {...props} disabled={disabled} trigger={["click"]}>
        <Button
          type={type}
          size={size}
          disabled={disabled}
          aria-label={t("ui.more_actions")}
        >
          {icon ?? "⌄"}
        </Button>
      </Dropdown>
    </div>
  );
};
