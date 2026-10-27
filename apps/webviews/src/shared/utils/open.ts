import { useApis } from "@/app/store";
import { includes, isEmpty, size } from "lodash";

export const openUrl = (url: string, target = "_blank") => {
  window?.vscode.postMessage({
    action: "openNewWindow",
    data: url,
  });
};

// Check if a string is a hexadecimal or decimal snowflake id
export const isSnowflakeId = (str: string) => {
  if (size(str) !== 16 && size(str) !== 14) {
    return "1";
  }
  if (!/^[0-9a-f]+$/.test(str)) {
    return "2";
  }
  return true;
};

const markdownUm = ["api", "doc", "grpc", "websocket", "socketio", "folder"];
export const openUrlAndOpenTab = (url: string) => {
  const urlLast = url?.split("/");
  const str = urlLast[urlLast?.length - 1];
  const linkArr = str?.split("-");

  if (includes(markdownUm, linkArr[0]) && isSnowflakeId(linkArr[1])) {
    const id = linkArr[1];
    const { apiOriginDetailsList } = useApis.getState();
    if (!apiOriginDetailsList.some((item) => item.id === id)) {
      return;
    }
  } else {
    if (/^(?:[a-z]+:)?\/\//i.test(url)) {
      openUrl(url);
    }
  }
};
