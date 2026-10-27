import { ApisBaseData } from "@onapi/http-model/requests/types/base";

export interface DocDetailsData extends ApisBaseData {
  attribute_info: Record<string, any>;
  description: string;
}
