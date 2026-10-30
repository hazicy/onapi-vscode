import { isNumber, isString } from "lodash";
import * as vscode from "vscode";
import * as childProcess from "child_process";
import fs from "fs";
import path from "path";
import os from "os";

export const saveTextFile = async (
  fileName: string,
  fileText: string,
  onWrite?: () => void,
): Promise<string | undefined> => {
  const downloadPath = path.join(os.homedir(), "Downloads");
  const uri = await vscode.window.showSaveDialog({
    defaultUri: vscode.Uri.file(path.join(downloadPath, fileName)),
    filters: { "Text files": ["json"], "All files": ["*"] },
  });
  if (!uri) {
    return undefined;
  }
  onWrite?.();
  fs.writeFileSync(uri.fsPath, fileText);
  return uri.fsPath;
};

export const downloadFile = async (fileName: string, fileText: string) => {
  try {
    const savedPath = await saveTextFile(fileName, fileText);
    if (!savedPath) {
      return false;
    }
    vscode.window.showInformationMessage("Export Successful！🎉: " + savedPath);
    return true;
  } catch (error: any) {
    vscode.window.showErrorMessage("Export failed: " + error?.message);
    return false;
  }
};

export const copyTextToClipboard = (text: string) => {
  vscode.env.clipboard.writeText(text).then(
    () => {
      // Successfully copied to clipboard
      vscode.window.showInformationMessage("Copy Success.");
    },
    (error) => {
      // Copy failed
      vscode.window.showErrorMessage("Copy Failed: " + error);
    },
  );
};

export const showTabName = (text: string): string => {
  if (text.length > 20) {
    return `${text.slice(0, 20)}...`;
  }
  return text;
};

export const getLocalIPv4 = () => {
  try {
    const interfaces: any = os.networkInterfaces();
    for (const i in interfaces) {
      for (const iface of interfaces[i]) {
        if (iface.family === "IPv4" && !iface.internal) {
          return iface.address;
        }
      }
    }
  } catch (error) {
    return "localhost";
  }
  return "localhost";
};

export const getVscodeFontSize = () => {
  try {
    const fontSize = vscode.workspace
      .getConfiguration("editor")
      .get("fontSize") as number;
    if (isNumber(fontSize)) {
      return fontSize;
    }

    return 12;
  } catch (error) {
    return 12;
  }
};

export const getVscodeFontFamily = () => {
  try {
    const fontFamily = vscode.workspace
      .getConfiguration("editor")
      .get("fontFamily") as string;
    if (isString(fontFamily)) {
      return fontFamily;
    }

    return "";
  } catch (error) {
    return "";
  }
};

export const openInFileExplorer = (filePath: string) => {
  const platform = os.platform();
  const normalizedPath = path.normalize(filePath);

  try {
    let command: string;
    switch (platform) {
      case "win32": // Windows
        // Use `/select` parameter to select file
        // Convert to Windows-style path
        const windowsPath = normalizedPath.replace(/\//g, "\\");
        // Check if path exists
        if (!fs.existsSync(windowsPath)) {
          vscode.window.showErrorMessage(`Path does not exist: ${windowsPath}`);
          return;
        }
        command = `explorer /select,"${windowsPath}"`;
        break;
      case "darwin": // macOS
        // Use `-R` parameter to locate file
        command = `open -R "${normalizedPath}"`;
        break;
      case "linux": // Linux
        // Use file manager command (e.g. nautilus) and specify parent directory
        const parentDir = path.dirname(normalizedPath);
        command = `xdg-open "${parentDir}"`;
        break;
      default:
        vscode.window.showErrorMessage(`Unsupported platform: ${platform}`);
        return;
    }
    childProcess.exec(command);
  } catch (error) {
    vscode.window.showErrorMessage(`Failed to reveal file: ${error}`);
  }
};
