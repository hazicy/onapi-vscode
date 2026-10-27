import React, { useRef, useState } from "react";
import clsx from "clsx";
import type { UIProps } from "./types";
import autoCompleteStyles from "./AutoComplete.module.css";
import { Autocomplete as Combobox } from "@base-ui/react/autocomplete";
import { Icon } from "@iconify/react";
import chevronDown from "@iconify-icons/lucide/chevron-down";

export function AutoComplete({
  value,
  defaultValue,
  onChange,
  onSearch,
  onSelect,
  options = [],
  children,
  allowClear,
  placeholder,
  className,
  style,
  disabled,
  showArrow = false,
  arrowClassName,
  triggerClassName,
  filterOption,
  ...props
}: UIProps) {
  const [input, setInput] = useState(defaultValue ?? "");
  const [popupOpen, setPopupOpen] = useState(false);
  const arrowRef = useRef<HTMLButtonElement>(null);
  const fieldRef = useRef<HTMLDivElement>(null);
  const dropdownAnchor = {
    get contextElement() {
      return fieldRef.current ?? undefined;
    },
    getBoundingClientRect() {
      const field = fieldRef.current?.getBoundingClientRect();
      const arrow = arrowRef.current?.getBoundingClientRect();
      return field && arrow
        ? new DOMRect(arrow.x, field.y, arrow.width, field.height)
        : new DOMRect();
    },
  };
  const current = value ?? input;
  return (
    <Combobox.Root
      modal={false}
      items={options}
      value={current}
      open={showArrow ? popupOpen : undefined}
      openOnInputClick={!showArrow}
      mode={showArrow ? "none" : "list"}
      onOpenChange={(open, details) => {
        if (!showArrow) {
          return;
        }
        if (open && details.reason !== "trigger-press") {
          details.cancel();
          return;
        }
        setPopupOpen(open);
      }}
      onValueChange={(v, details) => {
        setInput(v);
        onChange?.(v);
        onSearch?.(v);
        if (details.reason === "item-press") {
          onSelect?.(
            v,
            options.find((option: any) => option.value === v),
          );
        }
      }}
      itemToStringValue={(option: any) => String(option.value ?? "")}
      disabled={disabled}
    >
      <div
        ref={fieldRef}
        style={style}
        className={clsx(autoCompleteStyles.select, className)}
      >
        <Combobox.Input
          {...props}
          placeholder={placeholder}
          className={autoCompleteStyles.selectInput}
          render={
            React.isValidElement(children)
              ? (children as React.ReactElement)
              : undefined
          }
        />
        {allowClear && <Combobox.Clear aria-label="Clear">×</Combobox.Clear>}
        {showArrow && (
          <Combobox.Trigger
            ref={arrowRef}
            aria-label="Show options"
            className={clsx(autoCompleteStyles.arrow, arrowClassName)}
          >
            <Icon icon={chevronDown} width={14} />
          </Combobox.Trigger>
        )}
      </div>
      <Combobox.Portal>
        <Combobox.Positioner
          className={autoCompleteStyles.positioner}
          anchor={showArrow ? dropdownAnchor : undefined}
          side="bottom"
          align={showArrow ? "end" : "start"}
          sideOffset={showArrow ? 8 : 0}
        >
          <Combobox.Popup
            className={clsx(
              autoCompleteStyles.popup,
              showArrow && autoCompleteStyles.arrowPopup,
            )}
          >
            {showArrow && (
              <Combobox.Arrow className={autoCompleteStyles.popupArrow} />
            )}
            <Combobox.List className={autoCompleteStyles.options}>
              {(o: any) => (
                <Combobox.Item
                  key={o.value}
                  value={o}
                  className={autoCompleteStyles.option}
                >
                  {o.label ?? o.value}
                </Combobox.Item>
              )}
            </Combobox.List>
          </Combobox.Popup>
        </Combobox.Positioner>
      </Combobox.Portal>
    </Combobox.Root>
  );
}
