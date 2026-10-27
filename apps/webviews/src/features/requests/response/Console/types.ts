import { ApiSendResponseData } from "@onapi/domain/requests/types/send";

export type ConsoleContentProps = {
  consoleList: ApiSendResponseData["console"];
  onClear?: () => void;
};
