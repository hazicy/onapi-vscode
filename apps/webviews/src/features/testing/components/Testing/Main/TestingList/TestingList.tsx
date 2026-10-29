import type { ExecutionEvent } from "@onapi/contracts";
import { useTranslation } from "react-i18next";
import { LineTabs } from "@/shared/components";
import {
  nativeItems,
  itemFailed,
} from "@/features/testing/utils/native-results";
import ResultList from "./ResultList/ResultList";

export default function TestingList({ events }: { events: ExecutionEvent[] }) {
  const { t } = useTranslation();
  const groups = nativeItems(events).filter((group) =>
    group.some((event) => event.type === "item"),
  );
  const items = [
    { key: "all", label: t("supplement.all"), groups },
    {
      key: "success",
      label: t("supplement.success_report"),
      groups: groups.filter((group) => !itemFailed(group)),
    },
    {
      key: "failed",
      label: t("supplement.failed_report"),
      groups: groups.filter(itemFailed),
    },
  ].map(({ key, label, groups }) => ({
    key,
    label,
    children: <ResultList groups={groups} />,
    countParams: { dataSource: groups },
  }));
  return <LineTabs defaultActiveKey="all" items={items} />;
}
