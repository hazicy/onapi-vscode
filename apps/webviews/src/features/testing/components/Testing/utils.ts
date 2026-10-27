import { STATUS_CODE } from "@onapi/domain/constants/common";
import useTesting from "@/features/testing/store/useTesting";
import { produce } from "immer";
import { snowflakeId } from "@onapi/domain/utils/data-tools";
import { TestingReportList } from "@onapi/domain/testing/types/res/index";

/**
 *  Calculate pass rate
 */
export const getPercent = (percent: number, info: any) => {
  if (info.success + info.error === 0) {
    return "0%";
  }
  return `${((percent / (info.success + info.error)) * 100).toFixed(2)}%`;
};

export const saveReport = (complete: any) => {
  const {
    testingSendingData,
    eventList,
    testingName,
    testingConfig,
    testingReportList,
    updateTestingReportList,
  } = useTesting.getState();

  const reportDetail = {
    report_id: snowflakeId(),
    complete,
    requestList: testingSendingData?.requestList || [],
    eventAllCount: eventList.filter((i) => i.enabled === STATUS_CODE.ENABLE)
      .length,
    report_name: testingName,
    testingConfig,
  };
  const newTestingReportList = produce(testingReportList, (draft) => {
    draft.push(reportDetail);
  });
  updateTestingReportList(newTestingReportList);

  // Save report list to vscode
  window?.vscode.postMessage({
    action: "saveFolderTestData",
    data: {
      reportList: newTestingReportList,
    },
  });
};

export const setProjectReportList = (list: TestingReportList[]) => {
  const { updateProjectTestingReportList, projectTestingReportList } =
    useTesting.getState();

  const newReportList = produce(projectTestingReportList, (draft) => {
    return list;
  });
  updateProjectTestingReportList(newReportList);
};
