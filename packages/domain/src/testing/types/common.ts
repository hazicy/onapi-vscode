import { STATUS_CODE } from "@onapi/domain/constants/common";
import { CASE_ITEM_TYPE } from "@onapi/domain/testing/constants/index";

import {
  EventData,
  TestingDetailData,
} from "@onapi/domain/testing/types/index";
import { ApiDetailsData } from "@onapi/domain/requests/types/api";
import { ProjectConfigType } from "@onapi/domain/project/types/index";
import { SysConfig } from "@onapi/domain/settings/types/settings";

export type CaseDataIf = {
  var: string;
  compare: string;
  value: string;
};

export type CaseDataWait = {
  sleep: number;
};

export type CaseDataBegin = {
  name: string;
  iterationData: any[];
  iterates_data_id: string;
};

/**Test case steps */
export type CaseItem = {
  iteration_id?: string;
  event_id: string;
  test_id: string;
  project_id: string;
  type: CASE_ITEM_TYPE;
  enabled: STATUS_CODE;
  sort: number;
  data: {
    apiData?: ApiDetailsData | null;
    [key: string]: any;
  };
  parent_event_id: string;
  /**Whether bidirectional sync */
  auto_sync?: boolean;
  children?: CaseItem[];
};

/**Test case settings */
export type Settings = {
  /**Environment ID */
  env_id: string;
  /**Whether to use test data */
  enable_request: STATUS_CODE;
  /**Execution count */
  execute_count: number;
  /**Execution interval (ms) */
  interval_time: number;
  /**Whether to continue on error */
  ignore_error: STATUS_CODE;
  /**Sandbox run mode */
  enable_sandbox: STATUS_CODE;
  /**Test data */
  iteration_data: any[];

  //**Test file name */
  file_name?: string;

  /**unknown */
  iterates_data_list: any[];
  /**unknown */
  iterates_data_id: string;
};

// Test iteration data
export type IteratesData = {
  project_id: string;
  testing_id: string;
  iterates_id: string;
  name: string;
  created_at: string;
  data: IterateData;
};

export type IterateData = {
  [env_id: string]: Array<object | string>;
};

/**
 * Test case execution params
 */
export type RunnerTestingParams = {
  originName?: string;
  originSleep?: number;
  originEnvId?: string;
  originIterationCount?: number;
  testingData: TestingDetailData;
  projectConfig?: ProjectConfigType;
  systemConfig?: SysConfig;
};

/**
 * Test case execution params
 */
export type RunnerTestingProps = {
  originName?: string;
  originSleep?: number;
  originEnvId?: string;
  originIterationCount?: number;
  testingData: EventData;
  projectConfig?: ProjectConfigType;
  systemConfig?: SysConfig;
  originCollection?: Omit<ApiDetailsData, "response">[];
};

/**
 * Running test case
 */
export type RunnerTestingItem = {
  /**Whether running in background */
  isBackendRunner: boolean;
  /**Current execution ID */
  runnerId: string;
  /**Controller for cancellation */
  controller: AbortController;
  /**Test case name */
  name: string;
  /**Test case ID */
  testing_id: string;
  /**Execution result */
  testingResult?: any[];
  /**Execution log */
  caseList?: CaseItem[];
};
