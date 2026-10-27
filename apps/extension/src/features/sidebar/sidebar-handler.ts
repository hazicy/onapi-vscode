import { getExecutionCollection } from "../requests/execution/http-runner";
import * as vscode from "vscode";
import { storageChanged } from "../../platform/storage/events";
import {
  deleteProjectReport,
  deleteTestingFoldersData,
  getTestingFolderName,
} from "../testing/report-storage";
import { downloadFile, openInFileExplorer } from "../../platform/host-utils";
import { getAllChildIds, getMaxSort } from "../collections/collection-order";
import {
  getApiList,
  setApiList,
  updateApiList,
  setProjectApisVersion,
  getApiListName,
} from "../requests/request-storage";
import {
  getCurrentProjectConfig,
  setProjectConfig,
} from "../../platform/storage/project-config";
import { globalConfig } from "../../app/config";
import {
  cloneDeep,
  forEach,
  isArray,
  isEmpty,
  isFunction,
  isPlainObject,
} from "lodash";
import { updateOpenData } from "../requests/commands";
import {
  createShare,
  deleteShare,
  getOpenApi,
  getProjectShareData,
} from "../sharing/share-data";
import { snowflakeId } from "@onapi/http-model/utils/data-tools";
import { ApiDetailsData } from "@onapi/http-model/requests/types/api";
import { getStorageFilePath } from "../../platform/storage";

const persistApiList = async (
  list: ApiDetailsData[],
  context: vscode.ExtensionContext,
) => {
  if (await setApiList(list, context)) {
    return true;
  }
  vscode.window.showErrorMessage("Failed to save requests. Please try again.");
  return false;
};

const notifyApiListChanged = (
  apiList: ApiDetailsData[],
  context: vscode.ExtensionContext,
) => {
  const { pushWebView, shareListWebView, openedFolderTestPanels } =
    globalConfig;

  if (pushWebView) {
    pushWebView?.webview.postMessage({
      action: "setPushPanelData",
      data: {
        local_api_list: apiList,
      },
    });
  }

  if (shareListWebView) {
    shareListWebView?.webview.postMessage({
      action: "setApiList",
      data: apiList,
    });
  }

  // Update API list in run all
  if (
    isPlainObject(openedFolderTestPanels) &&
    !isEmpty(openedFolderTestPanels)
  ) {
    Object.keys(openedFolderTestPanels).forEach((folderName) => {
      let folder_id = folderName.split(":")[1];
      if (folder_id) {
        openedFolderTestPanels[folderName].webview.postMessage({
          action: "postmanCollectionChanged",
          data: getExecutionCollection(context),
        });
      }
    });
  }
};

const saveApiListItem = async (
  data: ApiDetailsData,
  context: vscode.ExtensionContext,
) => {
  const { openedPanels } = globalConfig;

  const workspace = getApiListName(context);
  let index = -1;
  let apiList: ApiDetailsData[] = [];
  const saved = await updateApiList(context, (current) => {
    apiList = current;
    index = current.findIndex((item) => item.id === data.id);
    if (index >= 0) {
      current[index] = data;
    } else {
      data.sort = getMaxSort(current, data.parentId);
      current.push(data);
    }
    return current;
  });
  if (!saved) {
    void vscode.window.showErrorMessage(
      "Failed to save requests. Please try again.",
    );
    return false;
  }
  if (getApiListName(context) !== workspace) {
    return true;
  }
  if (index > -1) {
    updateOpenData(openedPanels, data);
    if (data.kind === "folder") {
      const testPanel =
        globalConfig.openedFolderTestPanels[
          getTestingFolderName(data.id, context)
        ];
      if (testPanel) {
        testPanel.title = data.name;
        testPanel.webview.postMessage({
          action: "setTestData",
          data: { testingName: data.name },
        });
      }
    }
  }
  notifyApiListChanged(apiList, context);
  return true;
};

export const handleMessage = async (
  message: { action: string; data: any; option?: any },
  context: vscode.ExtensionContext,
) => {
  const openHandledAt = Date.now();
  const apiList: any[] = getApiList(context);

  const {
    openedPanels,
    openedFolderTestPanels,
    openedFolderTestReportDataPanels,
    pushWebView,
    shareListWebView,
  } = globalConfig;

  switch (message.action) {
    case "setApiList":
      if (!(await persistApiList(message.data, context))) {
        return false;
      }
      // Record project API versions for later conflict comparison
      setProjectApisVersion(context, message.data);
      // Update open data to latest
      forEach(globalConfig.openedPanels, (openedPanel, key) => {
        const openItem = message.data.find((i: any) => i?.id === key);
        if (isPlainObject(openItem)) {
          openedPanel.webview.postMessage({
            action: "setApiData",
            data: openItem,
          });
        }
      });

      if (pushWebView) {
        pushWebView?.webview.postMessage({
          action: "setPushPanelData",
          data: {
            local_api_list: message.data,
          },
        });
      }

      if (shareListWebView) {
        shareListWebView?.webview.postMessage({
          action: "setApiList",
          data: message.data,
        });
      }

      break;
    case "openTagPanel":
      vscode.commands.executeCommand("openTabPanel", message.data);
      break;

    case "openCurlPanel":
      vscode.commands.executeCommand("openCurlPanel");
      break;
    case "openImportDataPanel":
      vscode.commands.executeCommand("openImportDataPanel", message.data);
      break;
    case "openExportDataPanel":
      vscode.commands.executeCommand("openExportDataPanel", message.data);
      break;
    case "setProjectConfig":
      // Local stored data collection
      const project_config: Record<string, unknown> =
        getCurrentProjectConfig(context);
      if (isPlainObject(message.data)) {
        forEach(message.data, (value, key) => {
          project_config[key] = value;
        });
      }
      await setProjectConfig(context, project_config);
      break;
    case "switchProject":
      try {
        const { team, project } = message.data;
        if (!team || !project) {
          return;
        }

        // Clear open tabs
        forEach(openedPanels, (openedPanel) => {
          openedPanel.dispose();
        });

        // Clear open automated test tabs
        forEach(openedFolderTestPanels, (openedPanel) => {
          openedPanel.dispose();
        });

        // Clear open report result tabs
        forEach(openedFolderTestReportDataPanels, (openedPanel) => {
          openedPanel.dispose();
        });

        // Close all tab pages
        forEach(globalConfig, (panel) => {
          if (isFunction(panel?.dispose)) {
            panel.dispose();
          }
        });

        let new_user_config: any = context.globalState.get("userConfig") || {};
        // Update currently selected project
        new_user_config.currentTeam = team;
        new_user_config.currentProject = project;

        await context.globalState.update("userConfig", new_user_config);
        storageChanged.fire("userConfig");
      } catch (error) {}

      break;
    case "openTagPanelById":
      const curData = apiList.find(
        (i: ApiDetailsData) => i?.id === message.data,
      );
      if (!curData) {
        break;
      }
      vscode.commands.executeCommand("openTabPanel", curData, openHandledAt);
      break;
    case "createShare":
      createShare(message.data, context);
      // Refresh share list
      shareListWebView?.webview.postMessage({
        action: "setShareData",
        data: getProjectShareData(context),
      });
      break;
    case "saveFolder":
      return saveApiListItem(message?.data, context);
    case "cloneApi":
      const target = apiList.find((i) => i?.id === message.data.id);
      if (target === undefined) {
        return;
      }
      const dataNew = cloneDeep(target);
      dataNew.id = snowflakeId();
      dataNew.version = 0;
      if (dataNew?.name === "") {
        dataNew.name = "Create";
      }
      dataNew.name += ` Copy`;

      if (await saveApiListItem(dataNew, context)) {
        vscode.window.showInformationMessage("Duplicate Successfully");
      }

      break;
    case "showConfirmation":
      const projectKey = getApiListName(context);
      const result = await vscode.window.showInformationMessage(
        message.data.title,
        { modal: true },
        "Yes",
        "No",
      );
      if (result === "Yes") {
        if (getApiListName(context) !== projectKey) {
          return;
        }
        // Confirmation is asynchronous; preserve edits made while it was open.
        const currentList = getApiList(context);
        const curData = currentList.find((item) => item.id === message.data.id);
        if (!curData) {
          return;
        }
        const deletedIds = new Set<string>();
        let list: ApiDetailsData[] = [];
        const saved = await updateApiList(context, (latest) => {
          const root = latest.find((item) => item.id === curData.id);
          if (root) {
            for (const id of root.kind === "folder"
              ? getAllChildIds(latest, root)
              : [root.id]) {
              deletedIds.add(id);
            }
          }
          list = latest.filter((item) => !deletedIds.has(item.id));
          return list;
        });
        if (!saved) {
          void vscode.window.showErrorMessage(
            "Failed to save requests. Please try again.",
          );
          return false;
        }
        if (getApiListName(context) !== projectKey) {
          return;
        }
        for (const id of deletedIds) {
          openedPanels[id]?.dispose();
          if (curData.kind === "folder") {
            const folderName = getTestingFolderName(id, context);
            openedFolderTestPanels[folderName]?.dispose();
          }
        }

        if (
          curData.kind === "folder" &&
          !(await deleteTestingFoldersData(deletedIds, context))
        ) {
          vscode.window.showErrorMessage(
            "Requests were deleted, but saved test data could not be cleaned up.",
          );
        }
        notifyApiListChanged(list, context);
      }
      break;
    case "onDrop":
      // Find all elements under the moved directory
      if (isArray(message?.data?.ids)) {
        const workspace = getApiListName(context);
        const changedItems = new Map<string, ApiDetailsData>();
        const saved = await updateApiList(context, (apiList) => {
          forEach(message.data.ids, (id) => {
            const moved = apiList.find((item) => item.id === id);
            if (!moved) {
              return;
            }
            const parentId = message.data.parentId || "0";
            const { after_id: after, before_id: before } = message.data;
            if (after === "0" && before === "0") {
              moved.parentId = parentId;
              moved.sort = getMaxSort(apiList, parentId);
            } else {
              const insertAfter = after === "0" && before !== "0";
              const insertBefore = after !== "0" && before === "0";
              if (!insertAfter && !insertBefore) {
                return;
              }
              const siblings = apiList
                .filter((item) => item.parentId === parentId && item.id !== id)
                .sort((a, b) => a.sort - b.sort);
              const goalIndex = siblings.findIndex(
                (item) => item.id === (insertAfter ? before : after),
              );
              if (goalIndex < 0) {
                return;
              }
              moved.parentId = parentId;
              siblings.splice(goalIndex + (insertAfter ? 1 : 0), 0, moved);
              siblings.forEach((item, index) => {
                item.sort = index + 1;
                changedItems.set(item.id, item);
              });
            }
            changedItems.set(moved.id, moved);
          });
          return apiList;
        });
        if (!saved) {
          void vscode.window.showErrorMessage(
            "Failed to save requests. Please try again.",
          );
          return false;
        }
        if (getApiListName(context) !== workspace) {
          return;
        }
        if (changedItems.size === 0) {
          return;
        }
        changedItems.forEach((item) => updateOpenData(openedPanels, item));
        notifyApiListChanged(getApiList(context), context);

        vscode.window.showInformationMessage("Move Success");
      }
      break;
    case "runFolder":
      // Open folderTest page
      vscode.commands.executeCommand(
        "onapi.folderTest",
        message.data,
        message.option,
      );
      break;

    case "deleteReport":
      if (await deleteProjectReport(message?.data?.report_id, context)) {
        vscode.window.showInformationMessage("Delete Success");
        // Close already open tabs
        if (openedFolderTestReportDataPanels[message?.data?.report_id]) {
          openedFolderTestReportDataPanels[message?.data?.report_id].dispose();
        }
      }
      break;
    case "openNewWindow":
      vscode.env.openExternal(vscode.Uri.parse(message.data));
      break;
    case "deleteShare":
      deleteShare(message.data, context);

      break;

    case "exportOpenApiById":
      const openData = apiList.find((i) => i?.id === message?.data?.id);
      if (openData !== undefined) {
        const fileObj = await getOpenApi(openData, context);
        if (fileObj === null) {
          return;
        }
        await downloadFile(fileObj.fileName, fileObj.openApiStr);
      }
      break;

    case "openVscodeFileExplorer":
      openInFileExplorer(getStorageFilePath(context));

      break;
  }
};
