import clsx from "clsx";
import styles from "../ResponseResult.module.css";
import React, { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";

import { Flex } from "@/shared/ui/base";

import { isString } from "lodash-es";


import useSystemConfig from "@/features/settings/store/useSystemConfig";


interface Props {
  html?: string;
}

const Visualization: React.FC<Props> = (props) => {
  const { t } = useTranslation();
  const { html } = props || {};
  const visualizingRef = useRef<any>(null);
  
  const bg_color = useSystemConfig((state) => state.systemConfig.bg_color);

  useEffect(() => {
    if (isString(html)) {
      visualizingRef.current.contentDocument.body.innerHTML = `<div class="markdown-section">${html}</div>`;
      const style = document.createElement("style");

      const vscodeForeground = getComputedStyle(document.documentElement)
        .getPropertyValue("--vscode-foreground")
        .trim();
      const vscodeScrollBar =
        getComputedStyle(document.documentElement)
          .getPropertyValue("--vscode-scrollbarSlider-background")
          .trim() || "#242427";
      const vscodeScrollbarThumbHoverBgColor =
        getComputedStyle(document.documentElement)
          .getPropertyValue("--vscode-scrollbarSlider-hoverBackground")
          .trim() || "#323237";

      style.textContent = `
        body {
          color: ${vscodeForeground};
          font-size: 14px;
        }
        table {
          font-size: 14px;
        }
        ::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        ::-webkit-scrollbar-thumb {
          background-color: ${vscodeScrollBar};
          border-radius: 4px;
        }
        ::-webkit-scrollbar-track {
          background: transparent;
        }
        ::-webkit-scrollbar-track:hover {
          background-color: transparent !important;
        }
        ::-webkit-scrollbar-thumb:hover {
          background-color: ${vscodeScrollbarThumbHoverBgColor});
        }
        ::-webkit-scrollbar-corner {
          background-color: transparent;
        }
      `;
      visualizingRef.current.contentDocument.head.appendChild(style);
    }
  }, [visualizingRef, html, bg_color]);

  return (
    <div
      style={{ width: "100%", height: "100%", position: "relative" }}
      onFocus={() => 0}
      onBlur={() => 0}
    >
      {isString(html) ? (
        <>
          <iframe
            title={t("common.response_component.visualize")}
            ref={visualizingRef}
            width="100%"
            style={{ border: 0, height: "100%" }}
            frameBorder="0"
          ></iframe>
        </>
      ) : (
        <Flex
          vertical
          justify="center"
          gap={12}
          align="center"
          className={clsx(styles.visualizationEmpty, styles.flex)}
        >
          {t("common.response_component.visualize_tip")}
        </Flex>
      )}
    </div>
  );
};

export default Visualization;
