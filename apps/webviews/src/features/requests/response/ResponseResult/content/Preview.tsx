import { useTranslation } from "react-i18next";

import Empty from "@/shared/ui/Empty";
import type { ResponseContent } from "../content";
import { parseStreamToBody } from "@onapi/domain/utils/parse";

interface Props {
  content?: ResponseContent;
  rawEncode?: string;
}

const Preview = (props: Props) => {
  const { t } = useTranslation();
  const { content, rawEncode = "utf8" } = props || {};

  const streamData = content?.bytes
    ? parseStreamToBody(
        content?.bytes,
        { ext: content?.format, mime: content?.mime ?? "" },
        rawEncode,
      )
    : null;

  const setBodyColor = (html = "") => {
    const bgcolor = "white";
    let str = `<style>
          body{
            background:${bgcolor};
          }
        </style>`;
    return (str += html);
  };
  const responsePreview =
    content?.size && content?.size / 1024 / 1024 > 20 ? (
      <Empty description={t("supplement.file_big")} />
    ) : (
      <>
        {content?.display === "Monaco" ? (
          <div style={{ width: "100%", height: "100%", position: "relative" }}>
            <iframe
              sandbox=""
              srcDoc={setBodyColor(streamData?.rawBody)}
              title="w"
              frameBorder="0"
              width="100%"
              z-index="100"
              height="100%"
            ></iframe>
          </div>
        ) : content?.display === "Image" ? (
          <div style={{ width: 300 }}>
            <img src={streamData?.base64Body} style={{ maxWidth: "100%" }} />
          </div>
        ) : (
          <Empty description={t("supplement.no_view")} />
        )}
      </>
    );
  return <>{responsePreview}</>;
};

export default Preview;
