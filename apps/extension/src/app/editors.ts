import type * as vscode from "vscode";
import { registerCustomEditor } from "../platform/webviews/custom-editor";
import { RequestEditorProvider } from "../features/requests/request-editor-provider";
import {
  getApiList,
  getApiListName,
} from "../features/requests/request-storage";
import { resolveFolderTestEditor } from "../features/testing/folder-test-editor";
import { getProjectReportList } from "../features/testing/report-storage";
import { resolveTestReportEditor } from "../features/testing/test-report-editor";

/** Composition root: the platform knows editor lifecycles; features own their content. */
export function registerEditors(context: vscode.ExtensionContext) {
  const workspace = () => getApiListName(context);
  registerCustomEditor(
    context,
    {
      viewType: "onapi.request",
      provider: new RequestEditorProvider(context),
    },
    workspace,
  );
  registerCustomEditor(
    context,
    {
      viewType: "onapi.folderTest",
      resolve({ data, option }, panel) {
        const snapshot = data as { id: string };
        const current = getApiList(context).find(
          (item) => item.id === snapshot.id,
        );
        if (!current) {
          throw new Error("Test folder was removed from storage");
        }
        resolveFolderTestEditor(current, context, panel, option);
      },
    },
    workspace,
  );
  registerCustomEditor(
    context,
    {
      viewType: "onapi.testReport",
      resolve({ data }, panel) {
        const report = getProjectReportList(context).find(
          (item) =>
            item.report_id === (data as { report_id: string }).report_id,
        );
        if (!report) {
          throw new Error("Test report was removed from storage");
        }
        resolveTestReportEditor(report, context, panel);
      },
    },
    workspace,
  );
}
