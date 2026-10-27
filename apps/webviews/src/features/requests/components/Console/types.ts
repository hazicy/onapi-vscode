import { ApiSendResponseData } from "@onapi/http-model/requests/types/send";

export type ConsoleContentProps = {
  consoleList: ApiSendResponseData["console"];
  onClear?: () => void;
};
