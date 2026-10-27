import { language } from "../locale/index";
import { head } from "lodash";
import * as vscode from "vscode";
import os from "os";

export const getHtmlForWebview = (
  webviewUri: vscode.Uri | string,
  resourceBaseUrl: vscode.Uri,
  data?: any,
  script?: Boolean,
) => {
  const devServer = /^http:\/\/localhost:8080\//.test(String(webviewUri));
  return `
    <!DOCTYPE html>
    <html lang="${language}">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>My View</title>
      ${
        devServer
          ? `
      <script type="module">
        import RefreshRuntime from 'http://localhost:8080/@react-refresh';
        RefreshRuntime.injectIntoGlobalHook(window);
        window.$RefreshReg$ = () => {};
        window.$RefreshSig$ = () => (type) => type;
        window.__vite_plugin_react_preamble_installed__ = true;
      </script>
      <script type="module" src="http://localhost:8080/@vite/client"></script>
      `
          : `<link rel="stylesheet" href="${resourceBaseUrl}/webviews.css">`
      }
      <style>
        #loading {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: var(--vscode-editor-background);
            z-index: 1000;
            color: var(--vscode-breadcrumb-focusForeground, var(--vscode-foreground, #FFFFFF));
            display: flex;
            align-items: center;
            justify-content: center;
        }
    </style>
    </head>
    <body> 
      <div id="root">
        <div id="loading">loading...</div>
      </div>
      <script>
      performance.mark("onapi:html-ready");
      window.isMac = ${os.platform() === "darwin" ? "true" : "false"}
      window.vscode = acquireVsCodeApi();
      window.vscodeData = ${
        data
          ? JSON.stringify(data)
              .replace(/</g, "\\u003c")
              .replace(/\u2028/g, "\\u2028")
              .replace(/\u2029/g, "\\u2029")
          : "null"
      };
      window.resourceBaseUrl = "${resourceBaseUrl}";
    </script>
      <script type="module" src="${webviewUri}"></script>
      ${script && '<script async src="https://www.echoapi.cloud/analytics/analyticsv2.min.js"></script>'}
    </body>
    </html>
  `;
};
