export const openUrl = (url: string, target = "_blank") => {
  window?.vscode.postMessage({
    action: "openNewWindow",
    data: url,
  });
};
