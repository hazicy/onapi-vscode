import { ADD_CASE_DEFAULT } from "@onapi/http-model/testing/constants/default/index";
import { create } from "@/app/store/utils";
import { ApiDetailsData } from "@onapi/http-model/requests/types/api";
import {
  EventItem,
  TestingData,
  TestingDataListItem,
  TestingDetailData,
  TestingSendingData,
} from "@onapi/http-model/testing/types/index";
import {
  RunnerTestingItem,
  Settings,
} from "@onapi/http-model/testing/types/common";
import {
  TestingReportList,
  TestingReportListRes,
} from "@onapi/http-model/testing/types/res/index";

type State = {
  // raw base data flat list
  testingOriginBaseList: TestingData[];
  // testing base kv data
  testingBaseData: { [x: string]: TestingData };
  // test case details data
  testingDetailsData: { [x: string]: TestingDetailData };

  // test run result data
  testingSendingData: Partial<TestingSendingData>;

  // test report list
  testingReportList: TestingReportList[];

  // all test reports for current project
  projectTestingReportList: TestingReportList[];

  // tabs open list
  openTestingList: string[];
  // tabs open details
  openTestingListDetailData: { [x: string]: TestingDetailData };

  // currently active key
  testingActiveKey: string;
  // test data
  testingData: { [x: string]: TestingDataListItem[] };
  // interface case details
  sampleDetailsData: { [x: string]: any };
  // test report list
  testingReportData: { [x: string]: TestingReportListRes[] };

  // test config items
  testingConfig: Settings;

  // test interface list
  eventList: EventItem[];

  // running test cases
  runnerTestingList: RunnerTestingItem[];

  // save case loading
  saveLoading: boolean;
  // treeLoading
  treeLoading: boolean;
  // detail loading
  detailLoading: boolean;
  // test name
  testingName: string;
  // show report list
  showReportList: boolean;
};

type Action = {
  updateTestingOriginBaseList: (
    testingList: State["testingOriginBaseList"],
  ) => void;
  updateTestingBaseData: (testingBaseData: State["testingBaseData"]) => void;
  updateShowReportList: (showReportList: State["showReportList"]) => void;
  updateTestingDetailsData: (
    testingDetailsData: State["testingDetailsData"],
  ) => void;
  updateTestingDetailsDataItem: (
    testingDetailsData: State["testingDetailsData"],
  ) => void;

  updateTestingDetailDataByTestingId: (
    testingDetailData: TestingDetailData,
  ) => void;

  updateOpenTestingList: (openTestingList: State["openTestingList"]) => void;
  updateOpenTestingListDetailData: (
    openTestingListDetailData: State["openTestingListDetailData"],
  ) => void;

  updateOpenTestingDetailDataByTestingId: (
    openTestingDetailData: TestingDetailData,
  ) => void;

  updateTestingActiveKey: (testingActiveKey: State["testingActiveKey"]) => void;
  updateTestingData: (testingData: State["testingData"]) => void;

  updateSampleDetailsData: (sampleList: State["sampleDetailsData"]) => void;

  updateTestingReportData: (
    testingReportData: State["testingReportData"],
  ) => void;
  updateTestingReportList: (
    testingReportList: State["testingReportList"],
  ) => void;
  updateProjectTestingReportList: (
    projectTestingReportList: State["projectTestingReportList"],
  ) => void;

  updateTestingName: (testingName: State["testingName"]) => void;

  updateTestingConfig: (testingConfig: State["testingConfig"]) => void;

  updateEventList: (eventList: State["eventList"]) => void;

  updateRunnerTestingList: (
    runnerTestingList: State["runnerTestingList"],
  ) => void;

  updateSaveLoading: (saveLoading: State["saveLoading"]) => void;
  updateTreeLoading: (treeLoading: State["treeLoading"]) => void;
  updateDetailLoading: (detailLoading: State["detailLoading"]) => void;
  updateTestingSendingData: (
    testingSendingData: State["testingSendingData"],
  ) => void;
};

const useTesting = create<State & Action>()((set) => ({
  testingOriginBaseList: [],
  showReportList: false,
  testingBaseData: {},

  testingDetailsData: {},

  openTestingListDetailData: {},
  testingName: "",
  openTestingList: [],
  testingActiveKey: "",
  testingData: {},
  testingConfig: ADD_CASE_DEFAULT.settings,
  testingResult: [],
  eventList: [],
  sampleDetailsData: {},
  testingReportList: [],
  testingReportData: {},
  projectTestingReportList: [],
  runnerTestingList: [],
  testingSendingData: {},
  saveLoading: false,
  treeLoading: true,
  detailLoading: false,

  updateTestingOriginBaseList: (testingOriginBaseList) =>
    set(() => ({ testingOriginBaseList })),
  updateTestingBaseData: (testingBaseData) => set(() => ({ testingBaseData })),
  updateTestingDetailsData: (testingDetailsData) =>
    set(() => ({ testingDetailsData })),
  updateTestingDetailsDataItem: (payload) =>
    set((state) => ({
      testingDetailsData: {
        ...state.testingDetailsData,
        ...payload,
      },
    })),
  updateTestingDetailDataByTestingId: (payload) =>
    set((state) => ({
      testingDetailsData: {
        ...state.testingDetailsData,
        [payload.testing_id]: payload,
      },
    })),
  updateOpenTestingListDetailData: (openTestingListDetailData) =>
    set(() => ({ openTestingListDetailData })),

  updateOpenTestingList: (openTestingList) => set(() => ({ openTestingList })),
  updateTestingActiveKey: (testingActiveKey) =>
    set(() => ({ testingActiveKey })),
  updateTestingData: (testingData) => set(() => ({ testingData })),

  updateOpenTestingDetailDataByTestingId: (payload) =>
    set((state) => ({
      openTestingListDetailData: {
        ...state.openTestingListDetailData,
        [payload.testing_id]: payload,
      },
    })),

  updateSampleDetailsData: (sampleDetailsData) =>
    set(() => ({ sampleDetailsData })),

  updateTestingReportData: (testingReportData) =>
    set(() => ({ testingReportData })),
  updateTestingReportList: (testingReportList) =>
    set(() => ({ testingReportList })),
  updateProjectTestingReportList: (projectTestingReportList) =>
    set(() => ({ projectTestingReportList })),

  updateRunnerTestingList: (runnerTestingList) =>
    set(() => ({ runnerTestingList })),

  updateSaveLoading: (saveLoading) => set(() => ({ saveLoading })),
  updateTreeLoading: (treeLoading) => set(() => ({ treeLoading })),
  updateDetailLoading: (detailLoading) => set(() => ({ detailLoading })),
  updateTestingConfig: (testingConfig) => set(() => ({ testingConfig })),
  updateEventList: (eventList) => set(() => ({ eventList })),
  updateTestingSendingData: (testingSendingData) =>
    set(() => ({ testingSendingData })),
  updateTestingName: (testingName) => set(() => ({ testingName })),
  updateShowReportList: (showReportList) => set(() => ({ showReportList })),
}));

export default useTesting;
