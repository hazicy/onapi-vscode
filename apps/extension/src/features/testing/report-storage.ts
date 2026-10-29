import { forEach, isArray, isPlainObject } from "lodash";
import type { TestingReportList } from "@onapi/contracts";
import * as vscode from "vscode";
import {
  getDataFromGlobalStorage,
  updateDataInGlobalStorage,
} from "../../platform/storage/index";

export const getTestingFolderName = (
  folder_id: string,
  context: vscode.ExtensionContext,
) => {
  try {
    let user_config: any = context.globalState.get("userConfig") || {};
    let apiListName = `-1:${folder_id}:test`;
    if (
      user_config?.currentProject &&
      user_config?.currentProject?.project_id !== "-1"
    ) {
      apiListName = `${user_config.currentProject.project_id}:${folder_id}:test`;
    }
    return apiListName;
  } catch (error) {
    return `-1:${folder_id}:test`;
  }
};

export const getProjectTestName = (context: vscode.ExtensionContext) => {
  let projectTestName = `-1:test`;
  try {
    let user_config: any = context.globalState.get("userConfig") || {};
    if (
      user_config?.currentProject &&
      user_config?.currentProject?.project_id !== "-1"
    ) {
      projectTestName = `${user_config.currentProject.project_id}:test`;
    }
    return projectTestName;
  } catch (error) {
    return projectTestName;
  }
};

export const getTestingFolderData = (
  folder_id: string,
  context: vscode.ExtensionContext,
) => {
  try {
    let projectTestName = getProjectTestName(context);

    let projectTestData: any = getDataFromGlobalStorage(
      context,
      projectTestName,
    );
    const projectTestFolderData = projectTestData?.[folder_id] || {};
    return projectTestFolderData;
  } catch (error) {
    return {};
  }
};

export const setTestingFolderData = async (
  folder_id: string,
  data: any,
  context: vscode.ExtensionContext,
) => {
  if (!isPlainObject(data)) {
    return false;
  }
  return updateDataInGlobalStorage(
    context,
    getProjectTestName(context),
    (current) => {
      current[folder_id] = { ...current[folder_id], ...data };
      return current;
    },
  );
};

export const getProjectReportList = (context: vscode.ExtensionContext) => {
  try {
    let reslut: any[] = [];
    let projectTestName = getProjectTestName(context);

    let projectTestData: any = getDataFromGlobalStorage(
      context,
      projectTestName,
    );
    if (isPlainObject(projectTestData)) {
      forEach(projectTestData, (_val, key) => {
        if (isArray(projectTestData[key]?.reportList)) {
          reslut = reslut.concat(
            getNativeTestReports(projectTestData[key].reportList),
          );
        }
      });
    }
    reslut.sort((a, b) => b.startedAt - a.startedAt);
    return reslut;
  } catch (error) {
    return [];
  }
};

export const deleteProjectReport = async (
  report_id: string,
  context: vscode.ExtensionContext,
) =>
  updateDataInGlobalStorage(context, getProjectTestName(context), (current) => {
    for (const folder of Object.values(current) as any[]) {
      if (Array.isArray(folder.reportList)) {
        folder.reportList = folder.reportList.filter(
          (report: any) => report.report_id !== report_id,
        );
      }
    }
    return current;
  });

export const deleteTestingFoldersData = async (
  folderIds: Iterable<string>,
  context: vscode.ExtensionContext,
) => {
  const ids = [...folderIds];
  return updateDataInGlobalStorage(
    context,
    getProjectTestName(context),
    (current) => {
      for (const id of ids) {
        delete current[id];
      }
      return current;
    },
  );
};

export function getNativeTestReports(value: unknown): TestingReportList[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.filter(
    (report) =>
      report &&
      Array.isArray(report.events) &&
      typeof report.startedAt === "number" &&
      typeof report.finishedAt === "number" &&
      report.testingConfig &&
      typeof report.eventAllCount === "number",
  );
}
