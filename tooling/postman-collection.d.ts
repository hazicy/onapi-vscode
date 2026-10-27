import "postman-collection";

// postman-collection 5 supports GraphQL bodies; @types/postman-collection 3 omits them.
declare module "postman-collection" {
  interface GraphQLBodyDefinition {
    query?: string;
    operationName?: string;
    variables?: string | Record<string, unknown>;
  }

  interface RequestBodyDefinition {
    graphql?: GraphQLBodyDefinition;
  }

  interface RequestBody {
    graphql?: GraphQLBodyDefinition;
  }
}
