import CodeEditor from "@/shared/components/CodeEditor";
import type { EditorOptions } from "@/shared/components/CodeEditor";
import { isJSONString } from "@/shared/utils/common";
import useEditFormat from "@/shared/hooks/useEditFormat";
import { isString } from "lodash";
import { Empty } from "@/shared/ui";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

interface Props {
  rawHtml?: string;
  mode?: string;
  isSSE?: boolean;
  data?: any;
  editorOptions?: EditorOptions;
}

const Beautify = (props: Props) => {
  const { t } = useTranslation();

  const { mode, rawHtml, isSSE = false, data, editorOptions } = props || {};
  const source = useMemo(() => {
    let originData = rawHtml || "";
    if (isSSE) {
      try {
        if (isString(originData)) {
          originData = JSON.parse(originData);
        }
      } catch (err) {}
      if (isJSONString(originData)) {
        originData = JSON.parse(originData);
      } else {
        originData = rawHtml || "";
      }
    }
    return typeof originData === "string"
      ? originData
      : JSON.stringify(originData);
  }, [rawHtml, isSSE]);
  const { mode: language, value: editValue } = useEditFormat(source, mode);

  if (data?.response_size && data?.response_size / 1024 / 1024 > 10) {
    return <Empty description={t("supplement.file_big")} />;
  }

  return (
    <CodeEditor
      readOnly
      onMountAutoFormat={false}
      language={mode || language}
      value={editValue}
      options={editorOptions}
    />
  );
};

export default Beautify;
