import { forwardRef } from "./forwardRef";
import React, { useState } from "react";
import clsx from "clsx";
import type { UIProps } from "./types";
import selectStyles from "./Select.module.css";
import { useMemo } from "react";
import { Combobox } from "@base-ui/react/combobox";
import type { SelectProps, Option } from "./types";
import { Icon } from "@iconify/react";
import check from "@iconify-icons/lucide/check";

import { placement } from "./popupUtils";

const scalar = (v: any) => (v && typeof v === "object" ? v.value : v);

const text = (v: any): string =>
  typeof v === "string" || typeof v === "number"
    ? String(v)
    : React.isValidElement<{ children?: any }>(v)
      ? text(v.props.children)
      : Array.isArray(v)
        ? v.map(text).join("")
        : "";

const SelectControl = forwardRef<HTMLInputElement, SelectProps>(
  (
    {
      listClassName,
      optionClassName,
      optionContentClassName,
      indicatorClassName,
      groupLabelClassName,
      multipleClassName,
      inputClassName,
      triggerClassName,
      valueClassName,
      arrowClassName,

      singleClassName,
      outlinedClassName,
      searchClassName,
      options: rawOptions = [],
      children,
      value,
      defaultValue,
      onChange,
      onSelect,
      onDeselect,
      onSearch,
      mode,
      showSearch,
      allowClear,
      labelInValue,
      fieldNames,
      filterOption,
      optionFilterProp = "label",
      optionRender,
      labelRender,
      dropdownRender,
      popupRender,
      placeholder,
      disabled,
      className,
      rootClassName,
      style,
      placement,
      popupArrow,
      popupAnchor,
      popupSideOffset,
      popupArrowStyle,
      popupClassName,
      dropdownStyle,
      open,
      defaultOpen,
      onDropdownVisibleChange,
      onOpenChange,
      notFoundContent,
      size,
      bordered,
      variant,
      suffixIcon,
      removeIcon,
      maxTagCount,
      tagRender,
      tokenSeparators,
      autoClearSearchValue,
      loading,
      getPopupContainer,
      ...props
    },
    ref,
  ) => {
    const [search, setSearch] = useState("");
    const [internal, setInternal] = useState(defaultValue);
    const multiple = mode === "multiple" || mode === "tags";
    const options: Option[] = useMemo(
      () =>
        rawOptions.length
          ? rawOptions
              .flatMap((o, groupIndex) =>
                o.options
                  ? o.options.map((option: Option) => ({
                      ...option,
                      _group: { key: `options-${groupIndex}`, label: o.label },
                    }))
                  : [o],
              )
              .map((o) => ({
                ...o,
                value: o[fieldNames?.value || "value"],
                label: o[fieldNames?.label || "label"],
              }))
          : React.Children.toArray(children)
              .filter(React.isValidElement)
              .flatMap((c: any, groupIndex) =>
                c.type === Select.OptGroup
                  ? React.Children.toArray(c.props.children)
                      .filter(React.isValidElement)
                      .map((o: any) => ({
                        ...o.props,
                        label: o.props.children,
                        _group: {
                          key: `children-${groupIndex}`,
                          label: c.props.label,
                        },
                      }))
                  : [{ ...c.props, label: c.props.children }],
              ),
      [rawOptions, children, fieldNames],
    );
    const selected = value !== undefined ? value : internal;
    const values = multiple ? (selected ?? []) : selected;
    const current = (v: any) =>
      options.find((o) => o.value === scalar(v)) ?? {
        value: scalar(v),
        label: v?.label ?? scalar(v),
      };
    const selectedOptions = multiple
      ? values.map(current)
      : selected === undefined || selected === null
        ? null
        : current(selected);
    let filtered =
      filterOption === false
        ? options
        : options.filter((o) =>
            typeof filterOption === "function"
              ? filterOption(search, o)
              : text(o[optionFilterProp])
                  .toLowerCase()
                  .includes(search.toLowerCase()),
          );
    if (
      mode === "tags" &&
      search &&
      !options.some((o) => String(o.value) === search)
    ) {
      filtered = [...filtered, { label: search, value: search }];
    }
    const update = (next: any) => {
      const arr = multiple ? next : next ? [next] : [];
      const nextValue = multiple
        ? arr.map((o: any) =>
            labelInValue ? { value: o.value, label: o.label } : o.value,
          )
        : next
          ? labelInValue
            ? { value: next.value, label: next.label }
            : next.value
          : undefined;
      setInternal(nextValue);
      onChange?.(nextValue, multiple ? arr : next);
      for (const o of arr) {
        if (
          !(
            multiple
              ? (selectedOptions ?? [])
              : selectedOptions
                ? [selectedOptions]
                : []
          ).some((old: Option) => old.value === o.value)
        ) {
          onSelect?.(o.value, o);
        }
      }
      for (const o of multiple ? (selectedOptions ?? []) : []) {
        if (!arr.some((n: Option) => n.value === o.value)) {
          onDeselect?.(o.value, o);
        }
      }
      if (autoClearSearchValue !== false) {
        setSearch("");
      }
    };
    const renderOption = (o: Option, index: number) => (
      <Combobox.Item
        key={String(o.value)}
        value={o}
        disabled={o.disabled}
        className={clsx(selectStyles.option, optionClassName)}
      >
        <span className={optionContentClassName}>
          {optionRender ? optionRender({ ...o, data: o }, { index }) : o.label}
        </span>
        <Combobox.ItemIndicator
          className={clsx(selectStyles.itemIndicator, indicatorClassName)}
        >
          <Icon icon={check} width={14} />
        </Combobox.ItemIndicator>
      </Combobox.Item>
    );
    const groups: {
      key: string;
      label?: React.ReactNode;
      items: { option: Option; index: number }[];
    }[] = [];
    filtered.forEach((option, index) => {
      const key = option._group?.key ?? "ungrouped";
      let group = groups[groups.length - 1];
      if (!group || group.key !== key) {
        group = { key, label: option._group?.label, items: [] };
        groups.push(group);
      }
      group.items.push({ option, index });
    });
    const list = (
      <Combobox.List className={listClassName}>
        {groups.map((group, index) =>
          group.label !== null && group.label !== undefined ? (
            <Combobox.Group key={`${group.key}-${index}`}>
              <Combobox.GroupLabel
                className={clsx(selectStyles.groupLabel, groupLabelClassName)}
              >
                {group.label}
              </Combobox.GroupLabel>
              {group.items.map(({ option, index }) =>
                renderOption(option, index),
              )}
            </Combobox.Group>
          ) : (
            <React.Fragment key={`${group.key}-${index}`}>
              {group.items.map(({ option, index }) =>
                renderOption(option, index),
              )}
            </React.Fragment>
          ),
        )}
        {!filtered.length && (
          <div className={clsx(selectStyles.option, optionClassName)}>
            {notFoundContent ?? "No options"}
          </div>
        )}
      </Combobox.List>
    );
    const renderPopup = popupRender ?? dropdownRender;
    return (
      <Combobox.Root
        modal={false}
        items={filtered}
        filter={null}
        multiple={multiple}
        value={selectedOptions}
        onValueChange={update}
        inputValue={search}
        onInputValueChange={(s) => {
          if (
            mode === "tags" &&
            tokenSeparators?.some((separator: string) => s.includes(separator))
          ) {
            const parts: string[] = tokenSeparators.reduce(
              (parts: string[], separator: string) =>
                parts.flatMap((part) => part.split(separator)),
              [s],
            );
            const tags = parts.filter(Boolean).map((value) => current(value));
            update([
              ...(selectedOptions ?? []),
              ...tags.filter(
                (o) =>
                  !(selectedOptions ?? []).some(
                    (old: Option) => old.value === o.value,
                  ),
              ),
            ]);
            return;
          }
          setSearch(s);
          onSearch?.(s);
        }}
        itemToStringLabel={(o) => text(o.label)}
        itemToStringValue={(o) => String(o.value)}
        isItemEqualToValue={(a, b) => a.value === b.value}
        open={open}
        defaultOpen={defaultOpen}
        onOpenChange={(v) => {
          onDropdownVisibleChange?.(v);
          onOpenChange?.(v);
        }}
        disabled={disabled}
      >
        <div
          style={style}
          className={clsx(
            selectStyles.select,
            (bordered === false || variant === "borderless") &&
              selectStyles.borderless,
            multiple && multipleClassName,
            !multiple && singleClassName,
            bordered !== false && variant !== "borderless" && outlinedClassName,
            className,
            rootClassName,
          )}
        >
          {multiple && (
            <Combobox.Chips className={selectStyles.chips}>
              {(selectedOptions ?? []).map((o: Option) => (
                <Combobox.Chip
                  key={String(o.value)}
                  className={selectStyles.chip}
                >
                  {o.label}
                  <Combobox.ChipRemove aria-label={`Remove ${text(o.label)}`}>
                    ×
                  </Combobox.ChipRemove>
                </Combobox.Chip>
              ))}
            </Combobox.Chips>
          )}
          {showSearch || multiple ? (
            <Combobox.Input
              {...props}
              ref={ref}
              placeholder={
                selectedOptions && !multiple
                  ? text(selectedOptions.label)
                  : placeholder
              }
              className={clsx(
                selectStyles.input,
                inputClassName,
                searchClassName,
              )}
            />
          ) : (
            <Combobox.Trigger
              {...props}
              className={clsx(selectStyles.trigger, triggerClassName)}
            >
              <span className={valueClassName}>
                {selectedOptions
                  ? (labelRender?.({
                      label: selectedOptions.label,
                      value: selectedOptions.value,
                    }) ?? selectedOptions.label)
                  : placeholder}
              </span>
              <span
                className={clsx(selectStyles.arrow, arrowClassName)}
                aria-hidden="true"
              >
                {loading ? "…" : (suffixIcon ?? "⌄")}
              </span>
            </Combobox.Trigger>
          )}
          {allowClear && (
            <Combobox.Clear
              className={selectStyles.clear}
              aria-label="Clear selection"
            >
              ×
            </Combobox.Clear>
          )}
          {(showSearch || multiple) && (
            <Combobox.Trigger
              className={clsx(selectStyles.arrow, arrowClassName)}
              aria-label="Open options"
            >
              {loading ? "…" : (suffixIcon ?? "⌄")}
            </Combobox.Trigger>
          )}
        </div>
        <Combobox.Portal>
          <Combobox.Positioner
            anchor={popupAnchor}
            side={placement?.startsWith("top") ? "top" : "bottom"}
            align={
              placement?.endsWith("Left")
                ? "start"
                : placement?.endsWith("Right")
                  ? "end"
                  : "center"
            }
            sideOffset={popupSideOffset ?? (popupArrow ? 8 : 4)}
            className={selectStyles.positioner}
          >
            <Combobox.Popup
              className={clsx(selectStyles.popup, popupClassName)}
              style={dropdownStyle}
            >
              {popupArrow && (
                <Combobox.Arrow
                  className={selectStyles.popupArrow}
                  style={popupArrowStyle}
                >
                  <svg
                    width="14"
                    height="8"
                    viewBox="0 0 14 8"
                    aria-hidden="true"
                  >
                    <path d="M0 8 7 1 14 8" />
                  </svg>
                </Combobox.Arrow>
              )}
              {renderPopup ? renderPopup(list) : list}
            </Combobox.Popup>
          </Combobox.Positioner>
        </Combobox.Portal>
      </Combobox.Root>
    );
  },
);

export const Select = Object.assign(
  SelectControl as unknown as <V = any, O extends Option = Option>(
    props: SelectProps<V, O> & React.RefAttributes<HTMLInputElement>,
  ) => React.ReactElement,
  { Option: (_props: UIProps) => null, OptGroup: (_props: UIProps) => null },
);
