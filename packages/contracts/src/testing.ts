import type { ExecutionEvent } from "./index";
import type { Settings } from "@onapi/domain/testing/types/common";

export interface TestingSendingData {
  sendStatus: "initial" | "sending" | "sendOver";
  events: ExecutionEvent[];
  startedAt?: number;
  finishedAt?: number;
  environmentName?: string;
}

export interface TestingReportList {
  report_id: string;
  report_name: string;
  events: ExecutionEvent[];
  startedAt: number;
  finishedAt: number;
  environmentName: string;
  eventAllCount: number;
  testingConfig: Settings;
}
