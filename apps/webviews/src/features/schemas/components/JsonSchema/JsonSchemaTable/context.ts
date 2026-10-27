import React from "react";

export type LayoutProps = Array<{
  width?: number;
  flex?: number | any;
}>;

interface SchemaProviderProps {
  refTable: React.MutableRefObject<any>;
  layouts: LayoutProps;
  setLayouts: (newLayout: LayoutProps) => void;
  schemaData: any;
  getModelDetail: (model_id: string) => Promise<any>;
  parseModelToJsonSchema: (paranms: any) => any;
  getModelItem: (id: string) => any;
  model_id: string | undefined;
}

export const context = React.createContext<SchemaProviderProps | null>(null);

export default context;

export function useSchemaContext(): SchemaProviderProps {
  const value = React.useContext(context);
  if (!value) {
    throw new Error("Schema table components require a SchemaProvider");
  }
  return value;
}
