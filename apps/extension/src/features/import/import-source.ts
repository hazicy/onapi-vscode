import * as vscode from "vscode";
import i18next from "i18next";
import axios from "axios";
import { IMPORT_TYPE_ENUM } from "@onapi/domain/settings/constants/settings";
import { getCurrentProjectId } from "../../platform/storage/project-config";
import { parseImportSource } from "./import-data-handler";
import { curlImport } from "../curl/import-curl";

export type ImportPreview = {
  projectId: string;
  fileType: IMPORT_TYPE_ENUM;
  data: Awaited<ReturnType<typeof parseImportSource>>;
  name: string;
};

export function detectImportFormat(json: any): IMPORT_TYPE_ENUM {
  if (
    Array.isArray(json?.values) ||
    (json?.info && Array.isArray(json?.item))
  ) {
    return IMPORT_TYPE_ENUM.POSTMAN;
  }
  if (json?.openapi || json?.swagger) return IMPORT_TYPE_ENUM.SWAGGER;
  if (json?.http && Array.isArray(json?.apis)) return IMPORT_TYPE_ENUM.ONAPI;
  if (Array.isArray(json?.requests) && Array.isArray(json?.folders)) {
    return IMPORT_TYPE_ENUM.THUNDER_CLIENT;
  }
  throw new Error(i18next.t("importSource.unsupported"));
}

function validUrl(value: string) {
  try {
    return ["http:", "https:"].includes(new URL(value.trim()).protocol);
  } catch {
    return false;
  }
}

/** Native pickers collect input; only a successfully parsed source opens a Webview. */
export async function collectImportSource(
  options: { type?: string } | undefined,
  context: vscode.ExtensionContext,
  openPreview: (preview: ImportPreview) => void,
) {
  const t = (key: string) => i18next.t(`importSource.${key}`);
  const projectId = getCurrentProjectId(context);
  const method =
    options?.type === IMPORT_TYPE_ENUM.CURL
      ? "curl"
      : options?.type === IMPORT_TYPE_ENUM.SWAGGERURL
        ? "url"
        : options?.type
          ? "file"
          : (
              await vscode.window.showQuickPick(
                [
                  { label: `$(file) ${t("file")}`, method: "file" },
                  { label: `$(link) ${t("url")}`, method: "url" },
                  { label: `$(terminal) ${t("curl")}`, method: "curl" },
                ],
                {
                  title: i18next.t("importPanel.title"),
                  placeHolder: t("chooseSource"),
                },
              )
            )?.method;
  if (!method) return;

  try {
    if (method === "curl") {
      const input = await vscode.window.showInputBox({
        title: t("curl"),
        prompt: t("curlPrompt"),
        placeHolder: "curl https://api.example.com",
        ignoreFocusOut: true,
        validateInput: (value) =>
          !value.trim()
            ? t("required")
            : /^curl\s/i.test(value.trim()) || validUrl(value)
              ? undefined
              : t("invalidCurl"),
      });
      if (!input?.trim()) return;
      if (projectId !== getCurrentProjectId(context))
        throw new Error(t("workspaceChanged"));
      const value = input.trim();
      await curlImport(
        validUrl(value) ? `curl ${JSON.stringify(value)}` : value,
      );
      return;
    }

    let readSource: () => Promise<unknown>;
    let name: string;
    if (method === "url") {
      const url = await vscode.window.showInputBox({
        title: t("url"),
        placeHolder: "https://api.example.com/openapi.json",
        ignoreFocusOut: true,
        validateInput: (value) =>
          validUrl(value) ? undefined : i18next.t("importPanel.invalidUrl"),
      });
      if (!url?.trim()) return;
      name = url.trim();
      readSource = async () =>
        (await axios.get(name, { timeout: 30000, responseType: "text" })).data;
    } else {
      const files = await vscode.window.showOpenDialog({
        title: t("file"),
        openLabel: i18next.t("importPanel.preview"),
        canSelectFiles: true,
        canSelectFolders: false,
        canSelectMany: false,
        filters: { JSON: ["json"] },
      });
      const uri = files?.[0];
      if (!uri) return;
      name = uri.path.split("/").pop() || uri.path;
      readSource = async () =>
        Buffer.from(await vscode.workspace.fs.readFile(uri)).toString("utf8");
    }

    const preview = await vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: t("reading"),
      },
      async () => {
        const source = await readSource();
        if (typeof source === "string" && !source.trim()) {
          throw new Error(i18next.t("importPanel.emptyFile"));
        }
        const json =
          typeof source === "string"
            ? JSON.parse(source.replace(/^\uFEFF/, ""))
            : source;
        const fileType = detectImportFormat(json);
        if (projectId !== getCurrentProjectId(context))
          throw new Error(t("workspaceChanged"));
        const data = await parseImportSource(json, fileType, {}, context);
        if (projectId !== getCurrentProjectId(context))
          throw new Error(t("workspaceChanged"));
        if (!data.apis.length && !data.envs.length) throw new Error(t("empty"));
        return { fileType, data, name, projectId };
      },
    );
    openPreview(preview);
  } catch (error) {
    void vscode.window.showErrorMessage(
      `${i18next.t("interaction.importFailed")}: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}
