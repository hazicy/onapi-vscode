import styles from "./index.module.css";
import { memo, useState } from "react";
import {
  DndContext,
  PointerSensor,
  pointerWithin,
  useDraggable,
  useDndContext,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import type { DragEndEvent } from "@dnd-kit/core";
import { useTranslation } from "react-i18next";

import { Flex, Popconfirm, Switch } from "@/shared/ui/base";

import { useDeepCompareEffect, useMemoizedFn } from "ahooks";
import classNames from "classnames";
import { isEmpty, map } from "lodash";

import OrderNumber from "@/shared/components/SortableCollapse/OrderNumber";
import Collapse from "@/shared/ui/Collapse";
import AppIcon from "@/shared/ui/AppIcon";
import { STATUS_CODE } from "@onapi/http-model/constants/common";
import useTheme from "@/shared/hooks/useTheme";

import Arrow from "./Arrow";
import Tag from "./Tag";
import {
  AnyObject,
  DRAG_MODE,
  SortableCollapseProps,
  SortableItemProps,
} from "./types";
import { getDefaultActiveKey } from "./utils";

const SortableItem = <SortItem extends AnyObject>({
  isTree,
  orderNumber,
  rowKey,
  sortItem,
  ...restProps
}: SortableItemProps<SortItem>) => {
  const { t } = useTranslation();
  const {
    sortable = true,
    showOrderNumber = true,
    showTag = true,
    defaultTools = {},
    notChildren = [],
    hoverShowTools = true,
    isDefaultActiveKeyShowAll = false,
    isDefaultActiveItems = [],
    customHoverTools,
    customTools,
    customHeader,
    customContent,
    onCollapseChange,
    handleDragEnd,
  } = restProps;

  const { themeToken } = useTheme();

  const [activeKey, setActiveKey] = useState<string | undefined>();
  const [isHovered, setIsHovered] = useState(false);

  const showArrow = !notChildren.includes(sortItem.type);

  useDeepCompareEffect(() => {
    const defaultActiveKey = getDefaultActiveKey({
      isDefaultActiveKeyShowAll,
      isDefaultActiveItems,
      type: sortItem.type,
    });
    setActiveKey(defaultActiveKey);
  }, [isDefaultActiveItems, isDefaultActiveKeyShowAll]);

  const id = String(sortItem[rowKey]);
  const {
    attributes,
    listeners,
    setNodeRef: setHandleRef,
    isDragging,
  } = useDraggable({
    id,
    disabled: !sortable,
    data: { nodeKey: id, handleDragEnd },
  });
  const { setNodeRef: setContainerRef, isOver } = useDroppable({ id });
  const dragContext = useDndContext();
  const activeRect = dragContext.active?.rect.current.translated;
  const targetRect = dragContext.over?.rect;
  const pointerY = activeRect
    ? activeRect.top + activeRect.height / 2
    : undefined;
  const targetHeight = targetRect?.height ?? 0;
  const dragMode =
    pointerY === undefined || !targetRect
      ? null
      : pointerY < targetRect.top + targetHeight / 3
        ? DRAG_MODE.TOP
        : pointerY < targetRect.top + (targetHeight * 2) / 3
          ? DRAG_MODE.INSIDE
          : DRAG_MODE.BOTTOM;

  const renderHeader = useMemoizedFn(() => {
    return (
      <div
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <Flex align="center" gap={12}>
          {showOrderNumber && orderNumber && (
            <OrderNumber orderNumber={orderNumber} />
          )}
          {defaultTools.onSwitchChange && (
            <Switch
              size="small"
              checked={
                sortItem[defaultTools.switchKey || "enabled"] ===
                STATUS_CODE.ENABLE
              }
              onChange={(checked, event) => {
                event.stopPropagation();
                defaultTools.onSwitchChange?.(checked, sortItem);
              }}
            />
          )}
          {showTag && <Tag type={sortItem.type} />}
          {<Arrow show={showArrow} activeKey={activeKey} />}
          {customHeader && (
            <div className={styles.customHeader}>{customHeader(sortItem)}</div>
          )}
        </Flex>
      </div>
    );
  });

  const renderChildren = useMemoizedFn(() => {
    return (
      <div className={styles.children}>
        {map(sortItem.children, (children, idx: number) => {
          return (
            <SortableItem
              isTree={isTree}
              sortable={sortable}
              rowKey={rowKey}
              key={children[rowKey]}
              orderNumber={idx + 1}
              sortItem={children}
              handleDragEnd={handleDragEnd}
              {...restProps}
            />
          );
        })}
        {customContent && customContent(sortItem)}
      </div>
    );
  });

  const renderExtra = useMemoizedFn(() => {
    return (
      <Flex
        align="center"
        gap={12}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <Flex
          gap={themeToken.padding12}
          className={styles.tools}
          data-visible={!hoverShowTools || isHovered || undefined}
        >
          {customHoverTools && customHoverTools(sortItem)}
          {!isEmpty(defaultTools) && (
            <Flex gap={themeToken.padding12}>
              {defaultTools.onDelete && (
                <Popconfirm
                  title={t("common.tips")}
                  onConfirm={() => {
                    defaultTools.onDelete?.(sortItem);
                  }}
                >
                  <AppIcon
                    style={{ color: themeToken.iconColor }}
                    icon="trash-2"
                    className={styles.action}
                  />
                </Popconfirm>
              )}
            </Flex>
          )}
        </Flex>
        {customTools && customTools(sortItem)}
      </Flex>
    );
  });

  const items = [
    {
      key: sortItem.orderNumber,
      label: renderHeader(),
      children: renderChildren(),
      extra: renderExtra(),
    },
  ];

  const onChange = useMemoizedFn((activeKey: string | string[]) => {
    setActiveKey(activeKey[0]);
    onCollapseChange?.(activeKey[0], sortItem);
  });

  const top = isOver && dragMode === DRAG_MODE.TOP;
  const inside = isTree && isOver && dragMode === DRAG_MODE.INSIDE;
  const bottom = isOver && dragMode === DRAG_MODE.BOTTOM;

  return (
    <div
      ref={setContainerRef}
      className={styles.item}
      data-dragging={isDragging || undefined}
      data-drop-position={
        top
          ? DRAG_MODE.TOP
          : inside
            ? DRAG_MODE.INSIDE
            : bottom
              ? DRAG_MODE.BOTTOM
              : undefined
      }
    >
      {sortable && (
        <div
          ref={setHandleRef}
          className={styles.handle}
          {...attributes}
          {...listeners}
        >
          <AppIcon
            icon="grip-vertical"
            style={{
              color: themeToken.iconColor,
              fontSize: themeToken.fontSize,
            }}
          />
        </div>
      )}
      <div style={{ width: `calc(100% - ${sortable ? "20" : "0"}px)` }}>
        <Collapse
          headerPadding="4px 12px"
          activeKey={activeKey}
          bordered
          items={items as any}
          collapsible={showArrow ? "header" : "icon"}
          onChange={(activeKey) => onChange(activeKey)}
        />
      </div>
    </div>
  );
};

const PureSortableItem = memo(SortableItem) as typeof SortableItem;

const SortableCollapse = <SortItem extends AnyObject>({
  isTree,
  rowKey,
  sortable = true,
  sortItemList,
  handleDragEnd,
  wrapClassName,
  ...restProps
}: SortableCollapseProps<SortItem>) => {
  const sensors = useSensors(useSensor(PointerSensor));
  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) {
      return;
    }
    const activeRect = active.rect.current.translated;
    const targetRect = over.rect;
    const pointerY = activeRect
      ? activeRect.top + activeRect.height / 2
      : undefined;
    if (pointerY === undefined) {
      return;
    }
    const mode =
      pointerY < targetRect.top + targetRect.height / 3
        ? DRAG_MODE.TOP
        : pointerY < targetRect.top + (targetRect.height * 2) / 3
          ? DRAG_MODE.INSIDE
          : DRAG_MODE.BOTTOM;
    (
      active.data.current
        ?.handleDragEnd as SortableCollapseProps<SortItem>["handleDragEnd"]
    )?.(String(active.id), String(over.id), mode);
  };
  return (
    <DndContext
      sensors={sensors}
      collisionDetection={pointerWithin}
      onDragEnd={onDragEnd}
    >
      <div className={classNames(styles.container, wrapClassName)}>
        {map(sortItemList, (sortItem, index) => (
          <PureSortableItem
            isTree={isTree}
            handleDragEnd={handleDragEnd}
            sortable={sortable}
            rowKey={rowKey}
            key={sortItem[rowKey]}
            orderNumber={index + 1}
            sortItem={sortItem}
            {...restProps}
          />
        ))}
      </div>
    </DndContext>
  );
};

export default SortableCollapse;
