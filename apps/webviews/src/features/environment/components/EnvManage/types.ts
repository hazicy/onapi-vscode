import type { VariableDefinition } from "postman-collection";

export type IEnvDataItem = VariableDefinition & { static?: boolean };
