import { EventEmitter } from "vscode";

/** Notify extension views after a persisted data collection changes. */
export const storageChanged = new EventEmitter<string>();
