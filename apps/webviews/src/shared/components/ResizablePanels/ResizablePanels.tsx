import styles from "./ResizablePanels.module.css";
import {
  ReactNode,
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useId,
  useMemo,
} from "react";
import {
  Group,
  Panel,
  Separator,
  useDefaultLayout,
  type GroupImperativeHandle,
  type GroupProps,
  type PanelProps,
  type SeparatorProps,
} from "react-resizable-panels";

import { Flex } from "@/shared/ui/base";

import { useSafeState } from "ahooks";
import clsx from "clsx";

import AppIcon from "@/shared/ui/AppIcon";
import { usePanelPreferences } from "@/shared/contexts/panel-preferences";
import { DirectionType } from "@onapi/domain/types/common";

const defaultPanelProps = { defaultSize: 50, minSize: 5 };

// The app exposes percentage sizes; v4 interprets bare numbers as pixels.
type FinalPanelProps = Omit<
  PanelProps,
  "defaultSize" | "minSize" | "maxSize" | "collapsedSize"
> & {
  defaultSize?: number;
  minSize?: number;
  maxSize?: number;
  collapsedSize?: number;
  collapseTitle?: string;
};
type PanelGroupProps = Omit<GroupProps, "orientation"> & {
  direction: DirectionType;
  autoSaveId?: string;
};
const transientStorage = { getItem: () => null, setItem: () => {} };
const percent = (value?: number) =>
  value === undefined ? undefined : `${value}%`;
const sizeProps = (props: FinalPanelProps) => ({
  defaultSize: percent(props.defaultSize),
  minSize: percent(props.minSize),
  maxSize: percent(props.maxSize),
  collapsedSize: percent(props.collapsedSize),
});

type Props = {
  leftPanel: ReactNode;
  rightPanel: ReactNode;
  leftPanelProps?: FinalPanelProps;
  rightPanelProps?: FinalPanelProps;
  panelGroupProps?: PanelGroupProps;
  panelResizeHandleProps?: SeparatorProps;
  showDirectionBtn?: boolean;
  showRightCollapseBtn?: boolean;
  showStaticHandleBorder?: boolean;
  onDirectionChange?: (direction: DirectionType) => void;
};

const ResizablePanels = forwardRef((props: Props, ref) => {
  const {
    leftPanel,
    rightPanel,
    panelGroupProps = { direction: "horizontal" },
    leftPanelProps = { ...defaultPanelProps },
    rightPanelProps = { ...defaultPanelProps },
    panelResizeHandleProps,
    showDirectionBtn = false,
    showRightCollapseBtn = false,
    showStaticHandleBorder = true,
    onDirectionChange,
  } = props;

  const { direction: preferredDirection, language } = usePanelPreferences();

  const [direction, setDirection] = useSafeState<DirectionType>(
    panelGroupProps.direction,
  );
  const [collapse, setCollapse] = useSafeState<{
    left: boolean;
    right: boolean;
  }>({
    left: false,
    right: false,
  });

  const panelGroupRef = useRef<GroupImperativeHandle>(null);

  const instanceId = useId();
  const { autoSaveId, direction: _direction, ...groupProps } = panelGroupProps;
  const panelIds = useMemo(
    () => [
      `${autoSaveId || instanceId}-left`,
      `${autoSaveId || instanceId}-right`,
    ],
    [autoSaveId, instanceId],
  );
  const { defaultLayout, onLayoutChanged } = useDefaultLayout({
    id: `${autoSaveId || instanceId}-${direction}`,
    panelIds,
    storage: autoSaveId ? undefined : transientStorage,
  });

  const isHorizontal = direction === "horizontal";
  const isVertical = direction === "vertical";

  useEffect(() => {
    panelGroupProps.direction && setDirection(panelGroupProps.direction);
  }, [panelGroupProps.direction]);

  // Follow the application's preferred direction only for opted-in panels.
  useEffect(() => {
    if (!showDirectionBtn || !preferredDirection) {
      return;
    }

    setDirection(preferredDirection);
    onDirectionChange?.(preferredDirection);
  }, [preferredDirection, showDirectionBtn]);

  useImperativeHandle(ref, () => ({
    setPanelGroupLayout,
    resetLayout,
  }));

  const setPanelGroupLayout = (layout: number[]) => {
    panelGroupRef.current?.setLayout({
      [panelIds[0]]: layout[0],
      [panelIds[1]]: layout[1],
    });
  };

  const resetLayout = () => {
    setPanelGroupLayout([50, 50]);
  };

  const handleCollapse = (position: "left" | "right", value: boolean) => {
    setCollapse((prev) =>
      prev[position] === value ? prev : { ...prev, [position]: value },
    );
  };

  const handleRightCollapseWithOne = () => {
    const size = rightPanelProps.collapsedSize || defaultPanelProps.minSize;
    setPanelGroupLayout([100 - size, size]);
  };

  const renderPanel = (side: "left" | "right") => {
    const isLeft = side === "left";
    const props = isLeft ? leftPanelProps : rightPanelProps;
    const { collapseTitle, onResize, className, ...panelProps } = props;
    const content = isLeft ? leftPanel : rightPanel;
    const rotate = isVertical ? (isLeft ? 270 : 90) : isLeft ? 180 : 0;

    return (
      <Panel
        {...panelProps}
        {...sizeProps(props)}
        id={panelIds[isLeft ? 0 : 1]}
        onResize={(size, id, previous) => {
          handleCollapse(
            side,
            Boolean(
              props.collapsible &&
              size.asPercentage <= (props.collapsedSize ?? 0) + 0.1,
            ),
          );
          onResize?.(size, id, previous);
        }}
        className={clsx(
          isLeft
            ? styles.resizablePanelLeftWrap
            : styles.resizablePanelRightWrap,
          className,
        )}
      >
        {collapse[side] ? (
          <div
            className={
              isLeft ? styles.leftCollapseWrap : styles.rightCollapseWrap
            }
            onClick={resetLayout}
          >
            <Flex
              vertical={isHorizontal}
              justify="center"
              align="center"
              className={styles.flex}
            >
              <AppIcon
                icon="panel-left-close"
                rotate={rotate}
                className={styles.icon}
              />
              <span
                className={clsx(
                  styles.collapseTitle,
                  styles[direction],
                  language === "en" && styles.noSpacing,
                )}
              >
                {collapseTitle || ""}
              </span>
            </Flex>
          </div>
        ) : (
          content
        )}
      </Panel>
    );
  };

  return (
    <div className={styles.container}>
      <Group
        {...groupProps}
        key={direction}
        orientation={direction}
        groupRef={panelGroupRef}
        defaultLayout={defaultLayout}
        onLayoutChanged={(layout, meta) => {
          onLayoutChanged(layout, meta);
          groupProps.onLayoutChanged?.(layout, meta);
        }}
      >
        {renderPanel("left")}
        {/* bar */}
        <Separator
          {...panelResizeHandleProps}
          className={clsx(
            styles.resizablePanelHandle,
            styles[direction],
            panelResizeHandleProps?.className,
            {
              [styles.staticHandleBorder]: showStaticHandleBorder,
            },
          )}
        >
          <div className={styles.resizableBar} aria-hidden="true" />
          {/* Collapse to one side */}
          {showRightCollapseBtn && !collapse.right && (
            <div
              className={styles.rightCollapseBtn}
              onClick={(event) => {
                event.stopPropagation();
                handleRightCollapseWithOne();
              }}
            >
              <AppIcon
                icon="chevron-down"
                rotate={isHorizontal ? -90 : 0}
                className={styles.icon}
              />
            </div>
          )}
        </Separator>
        {renderPanel("right")}
      </Group>
    </div>
  );
});

export default ResizablePanels;
