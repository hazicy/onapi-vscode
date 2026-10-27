import type * as vscode from "vscode";
import { requestUrl } from "@onapi/domain";
import { getCurrentRequestServer } from "./request-server";
import { getCodeHarRequest } from "./execution/http-runner";
import { proxyFetch2 } from "../../platform/http-client";

export async function fetchGraphQLSchema(
  data: any,
  context: vscode.ExtensionContext,
  panel: vscode.WebviewPanel,
) {
  const server = getCurrentRequestServer(context, data?.currentServerId);
  if (!requestUrl(data?.apiData || {}) && !server?.uri) {
    panel.webview.postMessage({
      action: "graphQLSchemaFetchResult",
      data: {
        code: 200,
        error: "Enter the server URL to retrieve the GraphQL Schema",
      },
    });
    return;
  }

  // Get real URL
  const harObj: any = await getCodeHarRequest(data?.apiData, context, {
    server_id: data?.currentServerId,
  });
  const url = harObj?.log?.entries?.[0]?.request?.url?.split("#")?.[0] || "";
  if (!url) {
    panel.webview.postMessage({
      action: "graphQLSchemaFetchResult",
      data: {
        code: 200,
        error: "Enter the server URL to retrieve the GraphQL Schema",
      },
    });
    return;
  }

  // Send cross-origin request
  const introspectionQuery = `
      query IntrospectionQuery {
        __schema {
          queryType { name }
          mutationType { name }
          subscriptionType { name }
          types {
            ...FullType
          }
          directives {
            name
            description
            locations
            args {
              ...InputValue
            }
          }
        }
      }
  
      fragment FullType on __Type {
        kind
        name
        description
        fields(includeDeprecated: true) {
          name
          description
          args {
            ...InputValue
          }
          type {
            ...TypeRef
          }
          isDeprecated
          deprecationReason
        }
        inputFields {
          ...InputValue
        }
        interfaces {
          ...TypeRef
        }
        enumValues(includeDeprecated: true) {
          name
          description
          isDeprecated
          deprecationReason
        }
        possibleTypes {
          ...TypeRef
        }
      }
  
      fragment InputValue on __InputValue {
        name
        description
        type { ...TypeRef }
        defaultValue
      }
  
      fragment TypeRef on __Type {
        kind
        name
        ofType {
          kind
          name
          ofType {
            kind
            name
            ofType {
              kind
              name
              ofType {
                kind
                name
                ofType {
                  kind
                  name
                  ofType {
                    kind
                    name
                    ofType {
                      kind
                      name
                    }
                  }
                }
              }
            }
          }
        }
      }
    `;

  const param = {
    url: url,
    headers: { "Content-Type": "application/json" },
    data: { query: introspectionQuery },
  };

  const res = await proxyFetch2(param);
  panel.webview.postMessage({
    action: "graphQLSchemaFetchResult",
    data: res,
  });
}
