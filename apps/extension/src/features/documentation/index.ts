import { getDocumentItems } from "../sharing/document-items";
import path from "node:path";
import express, { Request, Response } from "express";
import * as vscode from "vscode";
import {
  completeOpenApiData,
  getExportData,
  getProjectShareData,
  setApiDocsBaseUrl,
} from "../sharing/share-data";
import { getApiList } from "../requests/request-storage";
import { getLocalIPv4 } from "../../platform/host-utils";
import { exportMethod } from "@onapi/api-converter/export";
import { isEmpty, isPlainObject } from "lodash";

const PORT_START = 3000; // Starting port
const MAX_PORT = 5000; // Maximum port limit

let server: any;
export const createDocsApp = (context: vscode.ExtensionContext) => {
  const app = express();
  const resource = (name: string) =>
    path.join(context.extensionPath, "dist", name);
  app.get("/doc.js", (_req: Request, res: Response) => {
    res
      .type("application/javascript")
      .sendFile(resource("scalar.standalone.js"));
  });

  // Dynamically load Swagger docs and handle query parameters
  app.get("/api-docs", async (req: Request, res: Response) => {
    try {
      // Get query parameters
      const share_id = req?.query?.share_id as string; // Replace yourParam with your parameter name

      // Get share record (return error if not found)
      const shareData = getProjectShareData(context);
      if (!shareData?.[share_id]) {
        res
          .status(404)
          .sendFile(path.join(context.extensionPath, "dist", "404.html"));
        return "error";
      }
      // Find latest API data through record and convert to swagger format.
      const apiList = getApiList(context);
      const shareApiData = apiList.find((i) => i?.id === share_id);
      if (shareApiData === undefined) {
        res
          .status(404)
          .sendFile(path.join(context.extensionPath, "dist", "404.html"));
        return "error";
      }

      res.send(getDocumentationHtml(share_id));
    } catch (error) {}
  });

  // Set a route to return Swagger JSON data
  app.get("/swagger.json", async (req: Request, res: Response) => {
    // Get query parameters
    const share_id = req?.query?.share_id as string;
    // Get share record (return error if not found)
    const shareData = getProjectShareData(context);
    if (!shareData?.[share_id]) {
      res.json({});
      return "error";
    }
    // Find latest API data through record and convert to swagger format.
    const apiList = getApiList(context);
    const shareApiData = apiList.find((i) => i?.id === share_id);
    if (shareApiData === undefined || !isPlainObject(shareApiData)) {
      res.json({});
      return "error";
    }

    const apis = getDocumentItems(apiList, shareApiData);
    const json = getExportData({ apis }, context);
    if (shareApiData.kind === "folder") {
      json.project = { ...json.project, name: shareApiData.name };
    }

    // Prioritize using design data for display
    if (
      shareApiData.kind !== "folder" &&
      isPlainObject(shareApiData?.open_api) &&
      !isEmpty(shareApiData.open_api)
    ) {
      const openApi = completeOpenApiData(shareApiData.open_api, context);
      res.json(openApi);
      return;
    }

    const swaggerRes = await exportMethod.apiToSwagger(json, "3.0");
    if (swaggerRes.status === "success") {
      res.json(swaggerRes.data); // Return swagger.json data
    } else {
      res.json({});
    }
  });

  app.get(
    "/api-docs/images/logo_icon.png",
    async (_req: Request, res: Response) => {
      res.sendFile(
        path.join(context.extensionPath, "dist", "images", "logo_icon.png"),
      );
    },
  );

  return app;
};

export const startDocsServer = (
  context: vscode.ExtensionContext,
  port = PORT_START,
  reStart = false,
) => {
  const app = createDocsApp(context);
  server = app.listen(port, () => {
    const ipv4 = getLocalIPv4();
    // Server started successfully (record the port number)
    setApiDocsBaseUrl(context, `http://${ipv4}:${port}/api-docs`, reStart);
  });
  server.on("error", () => {
    if (port < MAX_PORT) {
      startDocsServer(context, port + 1, reStart); // Recursively try next port
    }
  });
};

// Stop server
function stopServer(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (server) {
      server.close((err: any) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    } else {
      resolve(); // If no server is running, resolve directly
    }
  });
}

// Example: stop server and restart
export const restartServer = async (
  context: vscode.ExtensionContext,
  newPort: number,
) => {
  try {
    await stopServer(); // Stop current server
    startDocsServer(context, newPort, true); // Restart server
  } catch (err) {}
};

const getDocumentationHtml = (shareId: string) => {
  const configuration = JSON.stringify({
    url: `/swagger.json?share_id=${encodeURIComponent(shareId)}`,
    // Keep all requests in the local browser; no hosted proxy or remote fonts.
    proxyUrl: "",
    withDefaultFonts: false,
    hideClientButton: true,
    showDeveloperTools: "never",
  }).replace(/</g, "\\u003c");
  return `<!DOCTYPE html>
<html>
  <head>
    <title>onapi</title>
    <meta charset="utf-8"/>
    <meta name="viewport" content="width=device-width, initial-scale=1">

    <style>
      body {
        margin: 0;
        padding: 0;
      }
      #app a[href^="https://scalar.com/"][href*="utm_source=powered-by"] {
        display: none;
      }
    </style>
  </head>
  <body>
    <div id="app"></div>
    <script src="/doc.js"></script>
    <script>Scalar.createApiReference('#app', ${configuration});</script>
  </body>
</html>`;
};
