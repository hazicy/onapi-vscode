import { ApisBaseData } from "@onapi/domain/requests/types/base";

export interface DocDetailsData extends ApisBaseData {
  attribute_info: Record<string, any>;
  description: string;
}
