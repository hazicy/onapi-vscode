import { ThemeToken } from "./src/shared/types/theme";
// src/typings.d.ts
declare module "*.png" {
  const src: string;
  export default src;
}
declare global {
  module "*.png" {
    const src: string;
    export default src;
  }

  module "*.svg?react" {
    import * as React from "react";

    const ReactComponent: React.FunctionComponent<
      React.ComponentProps<"svg"> & { title?: string }
    >;

    export default ReactComponent;
  }

  interface Window {
    isMac?: boolean;
    vscode: {
      postMessage: (message: any) => Thenable<boolean>;
    };
    vscodeData?: any;
    resourceBaseUrl?: string;
  }

  type GlobalThemeToken = ThemeToken;
}
