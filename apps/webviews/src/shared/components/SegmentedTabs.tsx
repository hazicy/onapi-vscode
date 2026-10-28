import styles from "./SegmentedTabs.module.css";
import clsx from "clsx";
import {
  FC,
  forwardRef,
  FunctionComponent,
  ReactNode,
  Ref,
  useEffect,
  useImperativeHandle,
} from "react";

import { Flex, Segmented, SegmentedProps } from "@/shared/ui/base";

import { useSafeState } from "ahooks";
import { isEqual, map } from "lodash-es";

type Props = SegmentedProps & {
  ref?: Ref<HTMLDivElement> | undefined;
  options: Array<{
    label: string | ReactNode;
    value: string;
    children: FunctionComponent | ReactNode | any;
  }>;
  tabBarStartContent?: ReactNode;
  tabBarExtraContent?: ReactNode;
  destroyInactiveTabs?: boolean;
  wrapClassName?: string;
  headerClassName?: string;
  contentClassName?: string;
  contentItemClassName?: string;
  extraClassName?: string;
};

const SegmentedTabs: FC<Props> = forwardRef(
  (
    {
      options,
      onChange,
      value,
      tabBarStartContent,
      tabBarExtraContent,
      destroyInactiveTabs = false,
      wrapClassName,
      headerClassName,
      contentClassName,
      contentItemClassName,
      extraClassName,
      ...resetProps
    },
    ref: any,
  ) => {
    const [tabValue, setTabValue] = useSafeState<string | number>();
    const [renderChildrenMap, setRenderChildrenMap] = useSafeState<
      Record<string, boolean>
    >({
      [value as string]: true,
    });

    useEffect(() => {
      if (isEqual(value, tabValue)) {
        return;
      }

      setTabValue(value);

      setRenderChildrenMap({
        ...(!destroyInactiveTabs ? renderChildrenMap : {}),
        [value as string]: true,
      });
    }, [
      value,
      tabValue,
      destroyInactiveTabs,
      setTabValue,
      setRenderChildrenMap,
      renderChildrenMap,
    ]);

    const handleTabValueChange: SegmentedProps["onChange"] = (value) => {
      // Trigger external change event
      onChange?.(value);
      setTabValue(value);
      setRenderChildrenMap({
        ...(!destroyInactiveTabs ? renderChildrenMap : {}),
        [value]: true,
      });
    };

    useImperativeHandle(ref, () => {
      return {
        handleTabValueChange,
      };
    });

    const mergeValue = value || tabValue;

    return (
      <Flex vertical className={clsx(styles.container, wrapClassName)}>
        <header className={clsx(styles.segmentedTabsHeader, headerClassName)}>
          <Flex align="center" style={{ width: "100%" }}>
            <Segmented
              options={options}
              value={mergeValue}
              onChange={handleTabValueChange}
              {...resetProps}
            />
            {tabBarStartContent && (
              <div className={styles.tabBarStartContentWrap}>
                {tabBarStartContent}
              </div>
            )}
            {tabBarExtraContent && (
              <div
                className={clsx(styles.tabBarExtraContentWrap, extraClassName)}
                style={{
                  marginInlineStart: "auto",
                  flex: "0 0 auto",
                  overflow: "visible",
                }}
              >
                {tabBarExtraContent}
              </div>
            )}
          </Flex>
        </header>
        <main className={clsx(styles.segmentedTabsContent, contentClassName)}>
          {map(
            options,
            (item) =>
              renderChildrenMap[item.value] && (
                <div
                  hidden={mergeValue !== item.value}
                  className={clsx(
                    styles.segmentedTabsContentItem,
                    contentItemClassName,
                  )}
                  key={item.value}
                >
                  {typeof item.children === "function" ? (
                    <item.children
                      key={item.value}
                      segmentedValue={mergeValue}
                      onChange={handleTabValueChange}
                    />
                  ) : (
                    item.children
                  )}
                </div>
              ),
          )}
        </main>
      </Flex>
    );
  },
);

export default SegmentedTabs;
