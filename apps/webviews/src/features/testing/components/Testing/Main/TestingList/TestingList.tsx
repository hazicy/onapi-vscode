import { useMemo, useRef } from "react";
import { useTranslation } from "react-i18next";

import type { TabsProps } from "@/shared/ui/base";
import { LineTabs } from "@/shared/components";

import ResultList from "./ResultList/ResultList";
import { filter, toUpper } from "lodash-es";
import { Settings } from "@onapi/domain/testing/types/common";
import { isAssertPass } from "@/shared/utils/common";

const TestingList = ({
  list,
  eventAllCount,
  testingConfig,
}: {
  list: Array<any>;
  eventAllCount: number;
  testingConfig: Settings;
}) => {
  const { t } = useTranslation();
  const containerRef = useRef<HTMLDivElement>(null);

  const items: TabsProps["items"] = useMemo(() => {
    return [
      {
        key: "1",
        label: t("supplement.all"),
        forceRender: true,
        children: (
          <div ref={containerRef}>
            <ResultList
              eventCount={eventAllCount}
              execute_count={testingConfig.execute_count}
              value={list || []}
            />
          </div>
        ),
        countParams: {
          dataSource: list || [],
        },
      },
      {
        key: "2",
        label: t("supplement.success_report"),
        forceRender: true,
        children: (
          <div ref={containerRef}>
            <ResultList
              eventCount={eventAllCount}
              execute_count={testingConfig.execute_count}
              value={
                filter(
                  list,
                  (item) =>
                    toUpper(item?.data?.status?.http) === "OK" &&
                    isAssertPass(item?.data?.status?.assert),
                ) || []
              }
            />
          </div>
        ),
        countParams: {
          dataSource:
            filter(
              list,
              (item) =>
                toUpper(item?.data?.status?.http) === "OK" &&
                isAssertPass(item?.data?.status?.assert),
            ) || [],
        },
      },
      {
        key: "3",
        label: t("supplement.failed_report"),
        forceRender: true,
        children: (
          <div ref={containerRef}>
            <ResultList
              eventCount={eventAllCount}
              execute_count={testingConfig.execute_count}
              value={
                filter(
                  list,
                  (item) =>
                    toUpper(item?.data?.status?.http) !== "OK" ||
                    !isAssertPass(item?.data?.status?.assert),
                ) || []
              }
            />
          </div>
        ),
        countParams: {
          dataSource:
            filter(
              list,
              (item) =>
                toUpper(item?.data?.status?.http) !== "OK" ||
                !isAssertPass(item?.data?.status?.assert),
            ) || [],
        },
      },
    ];
  }, [list]);

  return <LineTabs defaultActiveKey="1" items={items} />;
};

export default TestingList;
