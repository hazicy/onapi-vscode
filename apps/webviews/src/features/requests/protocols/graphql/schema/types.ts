import type { OperationTypeNode } from "graphql";

export type QueryValue =
  | string
  | number
  | boolean
  | null
  | QueryValue[]
  | { [key: string]: QueryValue };
export interface QueryArgument {
  name: string;
  value: QueryValue;
}
export interface QueryDirective {
  name: string;
  arguments?: QueryArgument[];
}
export interface QueryField {
  type?: string;
  name: string;
  children?: QueryField[] | null;
  fields?: QueryField[];
  arguments?: QueryArgument[];
  directives?: QueryDirective[];
}
export interface QueryDocument {
  type?: string;
  operation?: OperationTypeNode;
  name?: string;
  children?: QueryField[] | null;
  fields?: QueryField[];
  variables?: { name: string; type: string; required?: boolean }[];
}
export interface SchemaTypeRef {
  kind: string;
  name?: string | null;
  ofType?: SchemaTypeRef | null;
}
export interface SchemaInput {
  name: string;
  description?: string | null;
  type: SchemaTypeRef;
  defaultValue?: string | null;
}
export interface SchemaField {
  name: string;
  description?: string | null;
  type: SchemaTypeRef;
  args?: SchemaInput[];
  isDeprecated?: boolean;
  deprecationReason?: string | null;
}
export interface SchemaType extends SchemaTypeRef {
  name: string;
  description?: string | null;
  fields?: SchemaField[];
  interfaces?: SchemaTypeRef[];
  inputFields?: SchemaInput[];
  enumValues?: {
    name: string;
    description?: string | null;
    isDeprecated?: boolean;
    deprecationReason?: string | null;
  }[];
  possibleTypes?: SchemaTypeRef[];
}
export interface OrganizedSchema {
  queries?: SchemaType;
  mutations?: SchemaType;
  subscriptions?: SchemaType;
  objects: Record<string, SchemaType>;
  interfaces: Record<string, SchemaType>;
  unions: Record<string, SchemaType>;
  enums: Record<string, SchemaType>;
  inputObjects: Record<string, SchemaType>;
  scalars: Record<string, SchemaType>;
  directives: Record<
    string,
    {
      name: string;
      description?: string | null;
      locations: readonly string[];
      args: SchemaInput[];
    }
  >;
}
export interface InputOperation {
  name: string;
  description?: string | null;
  defaultValue?: string | null;
  type?: string | null;
}
export interface InputField {
  name: string;
  description?: string | null;
  defaultValue?: string | null;
  operations: InputOperation[];
}
export interface TreeArgument {
  name: string;
  description?: string | null;
  defaultValue?: string | null;
  type?: SchemaTypeRef;
  itemKind?: string | null;
  inputObjects?: InputField[];
}
export interface SchemaTreeNode {
  name: string;
  kind: string;
  itemKind?: string;
  key?: string;
  path?: string;
  children?: SchemaTreeNode[];
  args?: TreeArgument[];
  checkable?: boolean;
  isLeaf?: boolean;
  non_null?: boolean;
  description?: string | null;
  defaultValue?: string | null;
}
