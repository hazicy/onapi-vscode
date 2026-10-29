import useTesting from "@/features/testing/store/useTesting";
import { STATUS_CODE } from "@onapi/domain/constants/common";
import type { TestingReportList } from "@onapi/contracts";

export function saveReport() {
  const state = useTesting.getState();
  const run = state.testingSendingData;
  const report: TestingReportList = {
    report_id: crypto.randomUUID(),
    report_name: state.testingName,
    events: run.events,
    startedAt: run.startedAt!,
    finishedAt: run.finishedAt!,
    environmentName: run.environmentName || "",
    eventAllCount: state.eventList.filter(
      (event) => event.enabled === STATUS_CODE.ENABLE,
    ).length,
    testingConfig: state.testingConfig,
  };
  const reportList = [report, ...state.testingReportList];
  state.updateTestingReportList(reportList);
  window.vscode.postMessage({
    action: "saveFolderTestData",
    data: { reportList },
  });
}
