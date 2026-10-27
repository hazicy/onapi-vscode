import type { PanelDefinition } from "@onapi/contracts/request-panel";
import type {
  ApiDetailsData,
  ApisData,
} from "@onapi/domain/requests/types/api";

// Wire validation covers identity and executable fields. Editor metadata is
// carried through unchanged; these existing UI types require additional fields.
export function editorDefinition(value: PanelDefinition): ApisData {
  return value as unknown as ApisData;
}
export function editorDefinitions(values: PanelDefinition[]): ApiDetailsData[] {
  return values as unknown as ApiDetailsData[];
}
