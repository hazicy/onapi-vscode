// Possible JSON Schema types
export type JSONSchemaType =
  | "string"
  | "number"
  | "integer"
  | "boolean"
  | "object"
  | "array"
  | "null"
  | "any";

// Base type
interface JSONSchemaBase {
  type: JSONSchemaType;
  enum?: any[]; // Enum values
  default?: any; // Default value
  example?: any; // Example value
  mock?: any;
  description?: string;
  properties?: { [key: string]: JSONSchema };
}

// Properties
export interface JSONSchemaObject extends JSONSchemaBase {
  type: JSONSchemaType;
  format?: string;
  properties?: { [key: string]: JSONSchema }; // Object properties, name as key, type as value
  required?: string[]; // Required fields
  additionalProperties?: boolean | JSONSchema; // Whether additional properties are allowed
  description?: string;
  default?: string;
  example?: any;
}

// Array type
interface JSONSchemaArray extends JSONSchemaBase {
  type: "array";
  items: JSONSchema; // Array elements
}

// Combined type: supports anyOf、oneOf、allOf
interface JSONSchemaCombined extends JSONSchemaBase {
  anyOf?: JSONSchema[]; // Any matching type
  oneOf?: JSONSchema[]; // Only one matching type
  allOf?: JSONSchema[]; // All matching types
}

// JSON Schema type
export type JSONSchema =
  | JSONSchemaBase
  | JSONSchemaObject
  | JSONSchemaArray
  | JSONSchemaCombined;
