import * as vscode from "vscode";
import i18next from "i18next";
import { getExportData } from "./export-data";
import { saveTextFile } from "../../platform/host-utils";
import { getCurrentProjectId } from "../../platform/storage/project-config";

export async function exportProject(
  options: { type?: string; version?: string } | undefined,
  context: vscode.ExtensionContext,
) {
  const t = (key: string) => i18next.t(`exportFlow.${key}`);
  const projectId = getCurrentProjectId(context);
  try {
    const type =
      options?.type ||
      (
        await vscode.window.showQuickPick(
          [
            { label: "OnAPI", type: "onapi" },
            { label: "Postman 2.1", type: "postman" },
            { label: "OpenAPI / Swagger", type: "swagger" },
          ],
          { title: t("title"), placeHolder: t("format"), ignoreFocusOut: true },
        )
      )?.type;
    if (!type) return;
    const version =
      type === "swagger"
        ? options?.version ||
          (
            await vscode.window.showQuickPick(
              [
                { label: "OpenAPI 3.0", version: "3.0" },
                { label: "Swagger 2.0", version: "2.0" },
              ],
              {
                title: t("title"),
                placeHolder: t("version"),
                ignoreFocusOut: true,
              },
            )
          )?.version
        : "3.0";
    if (!version) return;
    if (projectId !== getCurrentProjectId(context))
      throw new Error(t("workspaceChanged"));
    const data = await vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: i18next.t("interaction.export_preparing"),
      },
      () => getExportData({ type, version }, context),
    );
    if (!data.fileName) throw new Error(t("unsupported"));
    if (projectId !== getCurrentProjectId(context))
      throw new Error(t("workspaceChanged"));
    const savedPath = await saveTextFile(data.fileName, data.fileText);
    if (savedPath)
      void vscode.window.showInformationMessage(
        `${i18next.t("interaction.export_complete")}: ${savedPath}`,
      );
  } catch (error) {
    void vscode.window.showErrorMessage(
      `${i18next.t("interaction.exportFailed")}: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}
