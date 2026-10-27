import { cloneDeep, isString, map } from "lodash";

import useVarReplaces from "../../variables/hooks/useVarReplaces";
import Har2languages from "har2languages";
import { message } from "@/shared/ui/base";
import { copyStringToClipboard } from "@/shared/utils/common";

const har2languages = new Har2languages();
// For API calls
const useCopyAsCurl = () => {
  const { varReplace } = useVarReplaces();
  // Variable replacement
  const copyAsCurl = (apiCodeHar: any, option?: any) => {
    try {
      const request = cloneDeep(apiCodeHar)?.log?.entries?.[0]?.request;
      request.url = request?.url?.split("#")[0];
      request.headers = map(request?.headers, (it) => {
        if (!isString(it.value)) {
          return { ...it, value: String(it.value) };
        }
        return it;
      });

      const languagesRes: any = har2languages.convert(request, "shell", "curl");

      if (languagesRes?.status === "error") {
        message.error(`${languagesRes?.message}`);
        return;
      }
      try {
        languagesRes.data = decodeURIComponent(languagesRes?.data);
        languagesRes.data = varReplace(languagesRes.data);
      } catch (error) {}

      copyStringToClipboard(languagesRes.data, () =>
        message.success("Copy Success"),
      );
    } catch (error) {}
  };

  return {
    copyAsCurl,
  };
};

export default useCopyAsCurl;
