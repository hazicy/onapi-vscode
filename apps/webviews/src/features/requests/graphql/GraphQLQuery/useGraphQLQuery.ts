import useApis from "@/features/requests/store/useApis";
import { message } from "@/shared/ui/base";

import { useTranslation } from "react-i18next";

import type {
  IntrospectionSchema,
  IntrospectionType,
  IntrospectionField,
  IntrospectionInputValue,
  IntrospectionEnumValue,
  IntrospectionTypeRef,
} from "graphql";
import type {
  OrganizedSchema,
  SchemaType,
  SchemaTypeRef,
  SchemaInput,
  SchemaField,
} from "@/features/requests/utils/graphql/types";

class InspectSchema {
  schema: OrganizedSchema;
  constructor() {
    this.schema = {
      objects: {},
      interfaces: {},
      unions: {},
      enums: {},
      inputObjects: {},
      scalars: {},
      directives: {},
    };
  }

  // Parse type reference
  parseTypeRef(type: IntrospectionTypeRef): SchemaTypeRef {
    if (!type) {
      throw new Error("Invalid GraphQL type reference");
    }

    const typeInfo: SchemaTypeRef = {
      kind: type.kind,
      name: "name" in type ? type.name : null,
    };

    if ("ofType" in type && type.ofType) {
      typeInfo.ofType = this.parseTypeRef(type.ofType);
    }

    return typeInfo;
  }

  // Parse input value (parameter or input field)
  parseInputValue(input: IntrospectionInputValue): SchemaInput {
    if (!input) {
      throw new Error("Invalid GraphQL type reference");
    }
    return {
      name: input.name,
      description: input.description,
      type: this.parseTypeRef(input.type),
      defaultValue: input.defaultValue,
    };
  }

  // Parse field
  parseField(field: IntrospectionField): SchemaField {
    if (!field) {
      throw new Error("Invalid GraphQL type reference");
    }
    return {
      name: field.name,
      description: field.description,
      type: this.parseTypeRef(field.type),
      args: field.args?.map((arg) => this.parseInputValue(arg)) || [],
      isDeprecated: field.isDeprecated,
      deprecationReason: field.deprecationReason,
    };
  }

  // Parse enum value
  parseEnumValue(enumValue: IntrospectionEnumValue) {
    return {
      name: enumValue.name,
      description: enumValue.description,
      isDeprecated: enumValue.isDeprecated,
      deprecationReason: enumValue.deprecationReason,
    };
  }

  // Parse full type
  parseFullType(type: IntrospectionType): SchemaType {
    const typeInfo: SchemaType = {
      kind: type.kind,
      name: type.name,
      description: type.description,
    };

    switch (type.kind) {
      case "OBJECT":
      case "INTERFACE":
        typeInfo.fields = type.fields?.map((f) => this.parseField(f)) || [];
        typeInfo.interfaces =
          type.interfaces?.map((i) => this.parseTypeRef(i)) || [];
        break;

      case "INPUT_OBJECT":
        typeInfo.inputFields =
          type.inputFields?.map((f) => this.parseInputValue(f)) || [];
        break;

      case "ENUM":
        typeInfo.enumValues =
          type.enumValues?.map((v) => this.parseEnumValue(v)) || [];
        break;

      case "UNION":
        typeInfo.possibleTypes =
          type.possibleTypes?.map((t) => this.parseTypeRef(t)) || [];
        break;
    }

    return typeInfo;
  }

  // Organize schema
  organizeSchema(schemaData: IntrospectionSchema) {
    // Record root type names
    const queryTypeName = schemaData.queryType?.name;
    const mutationTypeName = schemaData.mutationType?.name;
    const subscriptionTypeName = schemaData.subscriptionType?.name;

    // Process all types
    schemaData.types.forEach((type) => {
      if (type.name.startsWith("__")) {
        return;
      } // Skip built-in types

      const parsedType = this.parseFullType(type);

      switch (type.kind) {
        case "OBJECT":
          if (type.name === queryTypeName) {
            this.schema.queries = parsedType;
          } else if (type.name === mutationTypeName) {
            this.schema.mutations = parsedType;
          } else if (type.name === subscriptionTypeName) {
            this.schema.subscriptions = parsedType;
          } else {
            this.schema.objects[type.name] = parsedType;
          }
          break;
        case "INTERFACE":
          this.schema.interfaces[type.name] = parsedType;
          break;
        case "UNION":
          this.schema.unions[type.name] = parsedType;
          break;
        case "ENUM":
          this.schema.enums[type.name] = parsedType;
          break;
        case "INPUT_OBJECT":
          this.schema.inputObjects[type.name] = parsedType;
          break;
        case "SCALAR":
          this.schema.scalars[type.name] = parsedType;
          break;
      }
    });

    // Process directives
    if (schemaData.directives) {
      schemaData.directives.forEach((directive) => {
        this.schema.directives[directive.name] = {
          name: directive.name,
          description: directive.description,
          locations: directive.locations,
          args: directive.args?.map((arg) => this.parseInputValue(arg)) || [],
        };
      });
    }

    return this.schema;
  }

  // Get full type name (including non-null and list modifiers)
  getFullTypeName(type: SchemaTypeRef | null | undefined): string {
    if (!type) {
      return "Unknown";
    }
    if (type.kind === "NON_NULL") {
      return `${this.getFullTypeName(type.ofType)}!`;
    }
    if (type.kind === "LIST") {
      return `[${this.getFullTypeName(type.ofType)}]`;
    }
    return type.name || "Unknown";
  }

  // Generate type documentation
  generateTypeDoc() {
    let doc = "";

    // Queries
    if (this.schema.queries?.fields) {
      doc += "# Queries\n\n";
      this.schema.queries.fields.forEach((field) => {
        doc += `## ${field.name}\n`;
        if (field.description) {
          doc += `${field.description}\n\n`;
        }
        doc += `Type: ${this.getFullTypeName(field.type)}\n\n`;
        if (field.args?.length) {
          doc += "Arguments:\n";
          field.args.forEach((arg) => {
            doc += `- ${arg.name}: ${this.getFullTypeName(arg.type)}`;
            if (arg.defaultValue) {
              doc += ` = ${arg.defaultValue}`;
            }
            if (arg.description) {
              doc += ` - ${arg.description}`;
            }
            doc += "\n";
          });
        }
        doc += "\n";
      });
    }

    // Add documentation for other types similarly...

    return doc;
  }
}

const useGraphQLQuery = () => {
  const { t } = useTranslation();
  const handelGraphQLSchemaFetchResult = (result: {
    code: number;
    data: { data?: { __schema?: IntrospectionSchema }; errors?: unknown };
    error?: string;
  }) => {
    const { updateApisActiveData, apisActiveData, updateSchemaLoading } =
      useApis.getState();
    const { code, data, error } = result;
    if (code !== 200 || error) {
      message.error(t("graphql.refresh_fail"));
      updateSchemaLoading(false);
      return;
    }

    if (data?.errors) {
      message.error(t("graphql.refresh_fail"));
      updateSchemaLoading(false);
      return;
    }

    if (!data?.data?.__schema?.types) {
      message.error(t("graphql.refresh_fail"));
      updateSchemaLoading(false);
      return;
    }
    try {
      const organizedSchema = new InspectSchema().organizeSchema(
        data.data.__schema,
      );
      if (apisActiveData) {
        updateApisActiveData({
          ...apisActiveData,
          graphqlSchema: organizedSchema,
        });
      }
      message.success(t("supplement.refresh_success"));
    } catch (error) {
      message.error(
        error instanceof Error
          ? error.message
          : "Invalid GraphQL introspection response",
      );
    } finally {
      updateSchemaLoading(false);
    }
  };

  return {
    handelGraphQLSchemaFetchResult,
  };
};

export default useGraphQLQuery;
