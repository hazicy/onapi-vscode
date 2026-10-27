import { ApisBaseData } from "@onapi/http-model/requests/types/base";

export interface SocketServiceDetailsData extends ApisBaseData {
  method: "TCP" | "UDP";
  description: string;
  url: string;
  request: {
    //Connection timeout
    timeout: number;
    //Function info to execute after message received
    end_func: {
      //Function name to execute
      name: string;
      //Function input parameters
      option: any;
    };
  };
}

export type SocketServiceComponentType = {
  apisData: SocketServiceDetailsData;
  onApisDataChange: (data: SocketServiceDetailsData) => void;
};
