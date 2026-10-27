import { useTranslation } from "react-i18next";

import { isPlainObject, isUndefined } from "lodash";

import Empty from "@/shared/ui/Empty";
import { ApiSendingData } from "@onapi/http-model/requests/types/send";
import { parseStreamToBody } from "@onapi/http-model/utils/parse";

interface Props {
  data?: ApiSendingData["response"];
  rawEncode?: string;
}

const Preview = (props: Props) => {
  const { t } = useTranslation();
  const { data, rawEncode = "utf8" } = props || {};

  const streamData =
    !isUndefined(data?.stream?.data) && isPlainObject(data?.mime_type)
      ? parseStreamToBody(data?.stream?.data, data?.mime_type, rawEncode)
      : null;

  const setBodyColor = (html: any) => {
    const bgcolor = "white";
    let str = `<style>
          body{
            background:${bgcolor};
          }
        </style>`;
    return (str += html);
  };
  const responsePreview =
    data?.response_size && data?.response_size / 1024 / 1024 > 20 ? (
      <Empty description={t("supplement.file_big")} />
    ) : (
      <>
        {data?.fit_for_show === "Monaco" ? (
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
        ) : data?.fit_for_show === "Image" ? (
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
