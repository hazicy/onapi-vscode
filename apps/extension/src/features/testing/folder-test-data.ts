import type * as vscode from "vscode";
import { isHttpCollectionItem } from "@onapi/domain";
import { STATUS_CODE } from "@onapi/domain/constants/common";
import { CASE_ITEM_TYPE } from "@onapi/domain/testing/constants/index";
import { ADD_CASE_DEFAULT } from "@onapi/domain/testing/constants/default/index";
import { getApiList } from "../requests/request-storage";
import { getNativeTestReports, getTestingFolderData } from "./report-storage";
import type { EventItem } from "@onapi/domain/testing/types/index";

/** Return requests in tree order, including nested folders but excluding siblings. */
export function getFolderTestEvents(
  folderId: string,
  context: vscode.ExtensionContext,
): EventItem[] {
  const rows = getApiList(context);
  const visited = new Set<string>([folderId]);
  const events: EventItem[] = [];
  function visit(parentId: string) {
    for (const row of rows
      .filter((row) => row.parentId === parentId)
      .sort((a, b) => (a.sort || 0) - (b.sort || 0))) {
      if (visited.has(row.id)) {
        continue;
      }
      visited.add(row.id);
      if (row.kind === "folder") {
        visit(row.id);
      } else if (isHttpCollectionItem(row) && row.request) {
        events.push({
          event_id: row.id,
          test_id: folderId,
          project_id: row.project_id,
          parent_event_id: row.parentId,
          type: CASE_ITEM_TYPE.API,
          enabled: STATUS_CODE.ENABLE,
          sort: events.length,
          data: row,
        });
      }
    }
  }
  visit(folderId);
  return events;
}

export function getFolderTestPageData(
  folderId: string,
  context: vscode.ExtensionContext,
) {
  const saved = getTestingFolderData(folderId, context) || {};
  return {
    eventList: getFolderTestEvents(folderId, context),
    config: { ...ADD_CASE_DEFAULT.settings, ...saved.config },
    reportList: getNativeTestReports(saved.reportList),
  };
}
