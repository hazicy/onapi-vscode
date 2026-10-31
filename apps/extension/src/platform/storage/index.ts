import type * as vscode from "vscode";

export const repositories = new WeakMap<
  vscode.ExtensionContext,
  {
    readonly root: vscode.Uri;
    readonly error?: string;
    has(key: string): boolean;
    get(key: string, fallback: any): any;
    set(key: string, value: any): Promise<boolean>;
    update(key: string, change: (value: any) => any): Promise<boolean>;
  }
>();

const writeFailures = new WeakMap<vscode.ExtensionContext, string>();

const repositoryFor = (context: vscode.ExtensionContext) => {
  const repository = repositories.get(context);
  if (!repository) {
    throw new Error("Storage repository has not been initialized");
  }
  return repository;
};

export const getStorageFilePath = (context: vscode.ExtensionContext) =>
  repositoryFor(context).root.fsPath;

export const hasStoredData = (context: vscode.ExtensionContext, key: string) =>
  repositoryFor(context).has(key);

export const getDataFromGlobalStorage = (
  context: vscode.ExtensionContext,
  key: string,
  defaultValue = {},
) => repositoryFor(context).get(key, defaultValue);

export const setDataToGlobalStorage = async (
  context: vscode.ExtensionContext,
  key: string,
  value: any,
) => {
  try {
    const saved = await repositoryFor(context).set(key, value);
    if (saved) {
      writeFailures.delete(context);
    }
    return saved;
  } catch (error) {
    writeFailures.set(
      context,
      error instanceof Error ? error.message : String(error),
    );
    return false;
  }
};

export const updateDataInGlobalStorage = async (
  context: vscode.ExtensionContext,
  key: string,
  change: (value: any) => any,
) => {
  try {
    const saved = await repositoryFor(context).update(key, change);
    if (saved) {
      writeFailures.delete(context);
    }
    return saved;
  } catch (error) {
    writeFailures.set(
      context,
      error instanceof Error ? error.message : String(error),
    );
    return false;
  }
};

export const getStorageError = (context: vscode.ExtensionContext) =>
  writeFailures.get(context) ?? repositories.get(context)?.error;
