// Request code generation and clipboard copying run in the extension host.
const useCopyAsCurl = () => ({
  copyAsCurl: (apiData: unknown, option?: unknown) => {
    window.vscode.postMessage({
      action: "copyAsCurl",
      data: { apiData },
      option,
    });
  },
});

export default useCopyAsCurl;
