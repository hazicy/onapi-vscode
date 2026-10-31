import type {
  OnapiGraphQLRequest,
  OnapiGraphQLQuery,
} from "@onapi/domain/import/types/onapi";
import { snowflakeId } from "@onapi/domain/utils/data-tools";
import i18next from "i18next";
import {
  cloneDeep,
  has,
  isArray,
  isEmpty,
  isEqual,
  isPlainObject,
  isString,
  keys,
} from "lodash";

import { APIS_TARGET_TYPE_ENUM } from "@onapi/domain/requests/constants/index";
import { DEFAULT_WEBSOCKET_MESSAGE } from "@onapi/domain/requests/constants/request";
import { Auth } from "@onapi/domain/requests/types/auth";
import {
  ApisBaseDataItem,
  ExpectItem,
} from "@onapi/domain/requests/types/base";
import { grpcConfigSchema } from "@onapi/domain/requests/grpc";
import {
  ApisBaseRequestBody,
  SocketRequestBody,
} from "@onapi/domain/requests/types/request";
import { BaseResponse } from "@onapi/domain/requests/types/response";
import { SocketDetailsData } from "@onapi/domain/requests/types/socket";
import { SocketServiceDetailsData } from "@onapi/domain/requests/types/socket-service";
import {
  SocketIoConfig,
  SocketIoRequest,
} from "@onapi/domain/requests/types/socketio";
import {
  MessageItem,
  WebSocketRequest,
  WebSocketConfig,
} from "@onapi/domain/requests/types/websocket";

import type { OnapiGlobalParams } from "@onapi/domain/import/types/onapi";
import { ApiProjectImportParams } from "@onapi/domain/project/types/export";
import { genUrlByQuery } from "@onapi/domain/request-utils";
import { getSubstring } from "@onapi/domain/request-utils";

export const completionParameter = (
  parameter: OnapiGlobalParams["header"]["parameter"],
) => {
  if (isArray(parameter)) {
    return parameter.map(
      ({
        description = "",
        field_type = "String",
        is_checked = 1,
        key = "",
        value = "",
        not_null = 1,
        schema = {},
      }) => {
        const param = {
          param_id: snowflakeId(),
          description,
          field_type,
          is_checked,
          key,
          value,
          not_null,
          schema,
        };
        return param;
      },
    );
  }
  return [];
};

export const completionBodyParameter = (parameter: ApisBaseDataItem[]) => {
  if (isArray(parameter)) {
    return parameter?.map(
      ({
        field_type = "String",
        is_checked = 1,
        key,
        not_null = 1,
        value = "",
        description = "",
        content_type = "",
        file_name = "",
        file_base64 = "",
        schema = {},
      }) => ({
        param_id: snowflakeId(),
        field_type,
        is_checked,
        key,
        not_null,
        value,
        description,
        content_type,
        file_name,
        file_base64,
        schema,
      }),
    );
  }
  return [];
};

export const completionBodyRawParameter = (
  raw_parameter: ApisBaseDataItem[],
) => {
  if (isArray(raw_parameter)) {
    return raw_parameter?.map(
      ({
        description = "",
        field_type = "String",
        is_checked = 1,
        key = "",
        not_null = 1,
        value = "",
      }) => ({
        param_id: snowflakeId(),
        description,
        field_type,
        is_checked,
        key,
        not_null,
        value,
      }),
    );
  }
  return [];
};

export const completionTasks = (tasks: OnapiGlobalParams["post_tasks"]) => {
  if (isArray(tasks)) {
    return tasks?.map(
      ({ data = "", enabled = 1, type = "customScript", name = "" }) => ({
        data,
        enabled,
        id: snowflakeId(),
        type,
        name,
      }),
    );
  }
  return [];
};

export const completionAuth = (
  {
    type = "noauth",
    apikey,
    bearer,
    basic,
    digest,
    hawk,
    awsv4,
    ntlm,
    edgegrid,
    oauth1,
    oauth2,
    jwt,
    asap,
  }: Auth = {},
  isGlobal: boolean,
) => {
  const defaultType = isGlobal ? "noauth" : "inherit";
  return {
    type: type || defaultType,
    apikey: {
      key: apikey?.key || "",
      value: apikey?.value || "",
      in: apikey?.in || "header",
    },
    bearer: {
      key: bearer?.key || "",
    },
    basic: {
      username: basic?.username || "",
      password: basic?.password || "",
    },
    digest: {
      username: digest?.username || "",
      password: digest?.password || "",
      realm: digest?.realm || "",
      nonce: digest?.nonce || "",
      algorithm: digest?.algorithm || "MD5",
      qop: digest?.qop || "",
      nc: digest?.nc || "",
      cnonce: digest?.cnonce || "",
      opaque: digest?.opaque || "",
      disableRetryRequest: digest?.disableRetryRequest ? true : false,
    },
    hawk: {
      authId: hawk?.authId || "",
      authKey: hawk?.authKey || "",
      algorithm: hawk?.algorithm || "",
      user: hawk?.user || "",
      nonce: hawk?.nonce || "",
      extraData: hawk?.extraData || "",
      app: hawk?.app || "",
      delegation: hawk?.delegation || "",
      timestamp: hawk?.timestamp || "",
      includePayloadHash: hawk?.includePayloadHash ? true : false,
    },
    awsv4: {
      accessKey: awsv4?.accessKey || "",
      secretKey: awsv4?.secretKey || "",
      region: awsv4?.region || "",
      service: awsv4?.service || "",
      sessionToken: awsv4?.sessionToken || "",
      addAuthDataToQuery: awsv4?.addAuthDataToQuery ? true : false,
    },
    ntlm: {
      username: ntlm?.username || "",
      password: ntlm?.password || "",
      domain: ntlm?.domain || "",
      workstation: ntlm?.workstation || "",
      disableRetryRequest: ntlm?.disableRetryRequest ? true : false,
    },
    edgegrid: {
      accessToken: edgegrid?.accessToken || "",
      clientToken: edgegrid?.clientToken || "",
      clientSecret: edgegrid?.clientSecret || "",
      nonce: edgegrid?.nonce || "",
      timestamp: edgegrid?.timestamp || "",
      baseURi: edgegrid?.baseURi || "",
      headersToSign: edgegrid?.headersToSign || "",
    },
    oauth1: {
      consumerKey: oauth1?.consumerKey || "",
      consumerSecret: oauth1?.consumerSecret || "",
      signatureMethod: oauth1?.signatureMethod || "",
      addEmptyParamsToSign: oauth1?.addEmptyParamsToSign ? true : false,
      includeBodyHash: oauth1?.includeBodyHash ? true : false,
      addParamsToHeader: oauth1?.addParamsToHeader ? true : false,
      realm: oauth1?.realm || "",
      version: oauth1?.version || "",
      nonce: oauth1?.nonce || "",
      timestamp: oauth1?.timestamp || "",
      verifier: oauth1?.verifier || "",
      callback: oauth1?.callback || "",
      tokenSecret: oauth1?.tokenSecret || "",
      token: oauth1?.token || "",
      disableHeaderEncoding: oauth1?.disableHeaderEncoding ? true : false,
    },
    oauth2: {
      addTokenTo: oauth2?.addTokenTo || "header",
      headerPrefix: oauth2?.headerPrefix || "Bearer",
      access_token: oauth2?.access_token || "",
      grant_type: oauth2?.grant_type || "authorization_code",
      redirect_uri: oauth2?.redirect_uri || "",
      authUrl: oauth2?.authUrl || "",
      accessTokenUrl: oauth2?.accessTokenUrl || "",
      clientId: oauth2?.clientId || "",
      clientSecret: oauth2?.clientSecret || "",
      username: oauth2?.username || "",
      password: oauth2?.password || "",
      challengeAlgorithm: oauth2?.challengeAlgorithm || "S256",
      code_verifier: oauth2?.code_verifier || "Bearer",
      scope: oauth2?.scope || "",
      state: oauth2?.state || "",
      client_authentication: oauth2?.client_authentication || "header",
      refreshTokenUrl: oauth2?.refreshTokenUrl || "",
      authRequestParams: oauth2?.authRequestParams || [],
      tokenRequestParams: oauth2?.tokenRequestParams || [],
      refreshRequestParams: oauth2?.refreshRequestParams || [],
    },
    jwt: {
      addTokenTo: jwt?.addTokenTo || "header",
      algorithm: jwt?.algorithm || "HS256",
      secret: jwt?.secret || "",
      isSecretBase64Encoded: jwt?.isSecretBase64Encoded ? true : false,
      payload: jwt?.payload || "",
      headerPrefix: jwt?.headerPrefix || "Bearer",
      queryParamKey: jwt?.queryParamKey || "token",
      header: jwt?.header || "",
    },
    asap: {
      alg: asap?.alg || "HS256",
      iss: asap?.iss || "",
      aud: asap?.aud || "",
      kid: asap?.kid || "",
      privateKey: asap?.privateKey || "",
      sub: asap?.sub || "",
      claims: asap?.claims || "",
      exp: asap?.exp || "",
    },
  };
};

export const completionGlobalParam = (
  global_param: OnapiGlobalParams,
  isGlobal = false,
) => {
  return {
    auth: completionAuth(global_param?.auth, isGlobal),
    body: {
      parameter: completionParameter(global_param?.body?.parameter),
    },
    pre_tasks: completionTasks(global_param?.pre_tasks),
    post_tasks: completionTasks(global_param?.post_tasks),
    header: {
      parameter: completionParameter(global_param?.header?.parameter),
    },
    query: {
      parameter: completionParameter(global_param?.query?.parameter),
    },
    cookie: {
      parameter: completionParameter(global_param?.cookie?.parameter),
    },
    restful: global_param?.restful
      ? { parameter: completionParameter(global_param?.restful?.parameter) }
      : undefined,
  };
};

export const recursionSchema = (
  schemaObj: any,
  modelsMap: Record<string, string>,
): any => {
  // Clone once at the boundary; recursion only touches this private copy.
  const visit = (schema: any): any => {
    // 1. Non-object/array - return directly
    if (typeof schema !== "object" || schema === null) {
      return schema;
    }

    // 2. Handle arrays (recursively process each item)
    if (Array.isArray(schema)) {
      return schema.map(visit);
    }
    // 3. Process the cloned object in place.
    for (const key in schema) {
      const value = schema[key];
      if (
        ["ONAPI_REFS", "x-schema-refs"].includes(key) &&
        isPlainObject(value)
      ) {
        keys(value).forEach((e) => {
          const $ref = value[e]?.$ref;
          if (has(value[e], "ref")) {
            schema[key][e]["$ref"] = modelsMap?.[value[e]["ref"]];
            delete schema[key][e]["ref"];
          } else if (has(value[e], "$ref") && $ref) {
            const refId = $ref.split("/").pop() || "";
            schema[key][e].$ref = modelsMap?.[refId];
          }
          // Recursively process refEntry
          schema[key][e] = visit(value[e]);
        });
        schema["x-schema-refs"] = schema[key];
        delete schema["ONAPI_REFS"];
      } else if (["ONAPI_ORDERS", "x-schema-orders"].includes(key)) {
        schema["x-schema-orders"] = value;
        delete schema["ONAPI_ORDERS"];
      } else if (
        (key === "properties" || key === "x-schema-overrides") &&
        isPlainObject(schema[key]) &&
        !isEmpty(schema[key])
      ) {
        schema[key] = keys(schema[key])?.reduce(
          (pre: { [key: string]: any }, propertiesKey) => {
            pre[propertiesKey] = visit(schema[key][propertiesKey]);
            return pre;
          },
          {},
        );
      } else if (key === "$ref" && isString(schema[key])) {
        // Handle direct model reference in properties
        const refId = schema[key].split("/").pop() || "";
        if (modelsMap?.[refId]) {
          schema[key] = modelsMap?.[refId];
        }
      } else {
        schema[key] = visit(value);
      }
    }
    return schema;
  };

  try {
    return visit(cloneDeep(schemaObj));
  } catch (err) {
    return schemaObj;
  }
};

export const completionBody = (
  body: ApisBaseRequestBody,
  modelsMap: { [key: string]: string },
) => {
  return {
    mode: body?.mode || "none",
    parameter: completionBodyParameter(body?.parameter || []),
    raw: body?.raw || "",
    raw_parameter: completionBodyRawParameter(body?.raw_parameter || []),
    raw_schema: recursionSchema(body?.raw_schema, modelsMap), // schema recursion
    binary: body?.binary || null,
  };
};

export const completionSocketMethodBody = (
  body: SocketRequestBody,
  modelsMap: { [key: string]: string },
) => {
  return {
    mode: body?.mode || "xml",
    parameter: body?.parameter || [],
    raw: body?.raw || "",
    raw_parameter: body?.raw_parameter || [],
    raw_schema: recursionSchema(body?.raw_schema, modelsMap), // schema recursion
  };
};

export const completionExpect = (
  expect: ExpectItem,
  modelsMap: { [key: string]: string },
) => {
  return {
    code: getSubstring(expect?.code, 128) || "",
    content_type: expect?.content_type || "",
    is_default: expect?.is_default || 1,
    name: getSubstring(expect?.name, 255) || "",
    verify_type: expect?.verify_type || "",
    schema: recursionSchema(expect?.schema, modelsMap), // schema recursion
  };
};

export const completionExample = (
  example: BaseResponse["example"],
  modelsMap: { [key: string]: string },
) => {
  if (isArray(example)) {
    let exampleList = cloneDeep(example);
    const successExample = example?.find((e) => e?.example_id === "1");
    const failExample = example?.find((e) => e?.example_id === "2");
    const res = [];
    if (successExample) {
      res.push({
        example_id: "1",
        raw: successExample?.raw || "",
        raw_parameter: completionBodyRawParameter(
          successExample?.raw_parameter,
        ),
        expect: completionExpect(
          successExample?.expect as ExpectItem,
          modelsMap,
        ),
        headers: isArray(successExample?.headers) ? successExample.headers : [],
      });
      exampleList = exampleList?.filter(
        (e) => e?.example_id !== successExample?.example_id,
      );
    }
    if (failExample) {
      res.push({
        example_id: "2",
        raw: failExample?.raw || "",
        raw_parameter: completionBodyRawParameter(failExample?.raw_parameter),
        expect: completionExpect(failExample?.expect as ExpectItem, modelsMap),
        headers: isArray(failExample?.headers) ? failExample.headers : [],
      });
      exampleList = exampleList?.filter(
        (e) => e?.example_id !== failExample?.example_id,
      );
    }

    return exampleList?.reduce((pre, item) => {
      res.push({
        example_id: snowflakeId(),
        raw: item?.raw || "",
        raw_parameter: completionBodyRawParameter(item?.raw_parameter),
        expect: completionExpect(item?.expect as ExpectItem, modelsMap),
        headers: isArray(item?.headers) ? item.headers : [],
      });
      return pre;
    }, res);
  }
  return [];
};

export const completionResponse = (
  response: BaseResponse,
  modelsMap: { [key: string]: string },
) => {
  return {
    is_check_result: response?.is_check_result || 1,
    example: completionExample(response?.example, modelsMap),
  };
};

export const completionAttributeInfo = (
  attribute_info: Record<string, any>,
) => {
  if (isPlainObject(attribute_info)) {
    return attribute_info;
  }
  return {};
};

export const completionWebSocketConfig = (
  config: WebSocketConfig | undefined,
) => {
  if (isPlainObject(config)) {
    return {
      information_size: config?.information_size || 5,
      certificate_verification: config?.certificate_verification || -1,
      reconnect_num: config?.reconnect_num || 5,
      reconnect_time: config?.reconnect_time || 5000,
      shake_hands_timeout: config?.shake_hands_timeout || 0,
    };
  }
  return {
    certificate_verification: -1,
    information_size: 5,
    reconnect_num: 5,
    reconnect_time: 5000,
    shake_hands_timeout: 0,
  };
};

export const completionSocketIoConfig = (
  config: SocketIoConfig | undefined,
) => {
  if (isPlainObject(config)) {
    return {
      reconnect_num: config?.reconnect_num || 5,
      reconnect_time: config?.reconnect_time || 5000,
      shake_hands_path: config?.shake_hands_path || "/socket.io",
      shake_hands_timeout: config?.shake_hands_timeout || 0,
      socket_version: config?.socket_version || "v4",
      certificate_verification: config?.certificate_verification || -1,
    };
  }
  return {
    reconnect_num: 5,
    reconnect_time: 5000,
    shake_hands_path: "/socket.io",
    shake_hands_timeout: 0,
    socket_version: "v4",
    certificate_verification: -1,
  };
};

export const completionWebSocketMessage = (
  msg: Array<MessageItem>,
  modelsMap: { [key: string]: string },
) => {
  if (!msg || !isArray(msg)) {
    return [
      {
        ...DEFAULT_WEBSOCKET_MESSAGE,
        param_id: snowflakeId(),
      },
    ];
  }
  return msg?.map(({ name, request, response }) => ({
    name: name || i18next.t("supplement.msg"),
    param_id: snowflakeId(),
    request: {
      mode: request?.mode || "text",
      raw: request?.raw || "",
      raw_parameter: completionBodyRawParameter(request?.raw_parameter),
      raw_schema: recursionSchema(request?.raw_schema, modelsMap),
    },
    response: {
      mode: response?.mode || "text",
      raw: response?.raw || "",
      raw_parameter: completionBodyRawParameter(response?.raw_parameter),
      raw_schema: recursionSchema(response?.raw_schema, modelsMap),
    },
  }));
};

export const completionSocketIoRequest = (request: SocketIoRequest) => {
  return {
    header: {
      parameter: completionParameter(
        request?.header?.parameter as OnapiGlobalParams["header"]["parameter"],
      ),
    },
    query: {
      parameter: completionParameter(
        request?.query?.parameter as OnapiGlobalParams["query"]["parameter"],
      ),
    },
    cookie: {
      parameter: completionParameter(
        request?.cookie?.parameter as OnapiGlobalParams["cookie"]["parameter"],
      ),
    },
    event: {
      parameter: isArray(request?.event?.parameter)
        ? request?.event?.parameter?.map(
            ({
              description = "",
              field_type = "String",
              is_checked = 1,
              key = "",
              value,
              not_null = 1,
            }) => ({
              param_id: snowflakeId(),
              description,
              field_type,
              is_checked,
              key,
              value: isEqual(value, "1") ? value : "-1",
              not_null,
            }),
          )
        : [],
    },
  };
};

export const completionWebSocketRequest = (request: WebSocketRequest) => {
  return {
    header: {
      parameter: completionParameter(
        request?.header?.parameter as OnapiGlobalParams["header"]["parameter"],
      ),
    },
    query: {
      parameter: completionParameter(
        request?.query?.parameter as OnapiGlobalParams["query"]["parameter"],
      ),
    },
    cookie: {
      parameter: completionParameter(
        request?.cookie?.parameter as OnapiGlobalParams["cookie"]["parameter"],
      ),
    },
  };
};

export const completionSocketRequest = (
  request: SocketServiceDetailsData["request"],
) => {
  return {
    timeout: request?.timeout || 10,
    end_func: {
      name: request?.end_func?.name || "none",
      option: request?.end_func?.option || "",
    },
  };
};

export const completionSocketMethodRequest = (
  request: SocketDetailsData["request"],
  modelsMap: { [key: string]: string },
) => {
  return {
    body: completionSocketMethodBody(
      request?.body as SocketRequestBody,
      modelsMap,
    ),
    post_tasks: request?.post_tasks || [],
    configs: {
      charset: request?.configs?.charset || "utf8",
      func: {
        request: request?.configs?.func?.request || [],
        response: request?.configs?.func?.response || [],
      },
    },
  };
};

export const completionGraphqlRequestBody = (
  body: OnapiGraphQLRequest["body"],
  modelsMap: { [key: string]: string },
) => {
  let query_list: OnapiGraphQLQuery[] = [];
  if (isArray(body?.query_list)) {
    query_list = body?.query_list?.map(
      ({ name = "", query = "", variables = "", response }) => ({
        param_id: snowflakeId(),
        name,
        query,
        variables,
        response: {
          mode: response?.mode || "json",
          raw: response?.raw || "",
          raw_parameter:
            completionBodyRawParameter(response?.raw_parameter) || [],
          raw_schema: recursionSchema(response?.raw_schema || {}, modelsMap),
        },
      }),
    );
  }
  return {
    query_list,
    query_schema: isPlainObject(body?.query_schema) ? body?.query_schema : {},
  };
};

export const completionGraphqlRequest = (
  request: OnapiGraphQLRequest,
  modelsMap: { [key: string]: string },
) => {
  return {
    auth: completionAuth(request?.auth, false),
    header: {
      parameter: completionParameter(
        request?.header?.parameter as OnapiGlobalParams["header"]["parameter"],
      ),
    },
    cookie: {
      parameter: completionParameter(
        request?.cookie?.parameter as OnapiGlobalParams["cookie"]["parameter"],
      ),
    },
    pre_tasks: completionTasks(request?.pre_tasks),
    post_tasks: completionTasks(request?.post_tasks),
    body: completionGraphqlRequestBody(request?.body, modelsMap),
  };
};

export const completionApis = (
  apis: ApiProjectImportParams["apis"],
  apiMap: { [key: string]: string },
  modelsMap: { [key: string]: string },
  serversMap: { [key: string]: string },
  project_id: string,
) => {
  if (isArray(apis)) {
    return apis?.reduce(
      (
        pre: unknown[],
        {
          id,
          kind,
          parentId,
          name = "",
          sort = 0,
          version = 0,
          server_id,
          description,
          is_socket = 1,
          request,
          method = "GET",
          url = "",
          mark_id = "1",
          protocol = "http/1.1",
          response,
          attribute_info,
          tags,
          config,
          grpc,
          message,
        },
      ) => {
        const baseApiInfo = {
          id: apiMap?.[id] || snowflakeId(),
          project_id,
          parentId: apiMap?.[parentId] || "0",
          kind,
          name: getSubstring(name, 255),
          version,
          sort,
          description,
        };
        if (kind === APIS_TARGET_TYPE_ENUM.FOLDER) {
          pre.push({
            ...baseApiInfo,
            server_id: has(serversMap, server_id) ? serversMap[server_id] : "0",
            request: completionGlobalParam(
              request as unknown as OnapiGlobalParams,
            ),
            is_socket,
          });
        }
        if (kind === APIS_TARGET_TYPE_ENUM.API) {
          pre.push({
            ...baseApiInfo,
            method,
            url:
              url && isArray(request?.query?.parameter)
                ? genUrlByQuery(url, request?.query?.parameter)
                : url,
            mark_id,
            protocol,
            request: {
              ...completionGlobalParam(request as unknown as OnapiGlobalParams),
              body: {
                ...completionBody(
                  request?.body as ApisBaseRequestBody,
                  modelsMap,
                ),
              },
            },
            response: completionResponse(response, modelsMap),
            attribute_info: completionAttributeInfo(attribute_info),
            tags,
            is_force: -1,
          });
        }
        if (kind === APIS_TARGET_TYPE_ENUM.WEBSOCKET) {
          pre.push({
            ...baseApiInfo,
            method,
            mark_id,
            url,
            is_socket,
            config: completionWebSocketConfig(config as WebSocketConfig),
            request: completionWebSocketRequest(
              request as unknown as WebSocketRequest,
            ),
            message: completionWebSocketMessage(
              message as unknown as Array<MessageItem>,
              modelsMap,
            ),
          });
        }
        if (kind === APIS_TARGET_TYPE_ENUM.DOC) {
          pre.push({
            ...baseApiInfo,
            attribute_info: completionAttributeInfo(attribute_info),
            is_socket,
            tags,
            mark_id,
          });
        }
        if (kind === APIS_TARGET_TYPE_ENUM.SOCKET) {
          pre.push({
            ...baseApiInfo,
            method,
            url,
            request: completionSocketRequest(
              request as SocketServiceDetailsData["request"],
            ),
          });
        }
        if (kind === APIS_TARGET_TYPE_ENUM.SOCKETIO) {
          pre.push({
            ...baseApiInfo,
            method: "",
            url:
              url && isArray(request?.query?.parameter)
                ? genUrlByQuery(url, request?.query?.parameter)
                : url,
            request: completionSocketIoRequest(
              request as unknown as SocketIoRequest,
            ),
            message: completionWebSocketMessage(
              message as unknown as Array<MessageItem>,
              modelsMap,
            ),
            attribute_info: completionAttributeInfo(attribute_info),
            tags,
            config: completionSocketIoConfig(
              config as unknown as SocketIoConfig,
            ),
          });
        }
        if (kind === APIS_TARGET_TYPE_ENUM.SOCKET_METHOD) {
          pre.push({
            ...baseApiInfo,
            method,
            url,
            mark_id,
            attribute_info,
            tags,
            request: completionSocketMethodRequest(
              request as SocketDetailsData["request"],
              modelsMap,
            ),
            response: {
              example: completionExample(response?.example, modelsMap),
              is_check_result: 1,
            },
          });
        }
        if (kind === APIS_TARGET_TYPE_ENUM.GRPC) {
          pre.push({
            ...baseApiInfo,
            mark_id,
            grpc: grpcConfigSchema.parse(grpc),
            url,
            status: 1,
          });
        }
        if (kind === APIS_TARGET_TYPE_ENUM.GRAPHQL) {
          pre.push({
            ...baseApiInfo,
            url,
            mark_id,
            attribute_info: completionAttributeInfo(attribute_info),
            tags,
            request: completionGraphqlRequest(
              request as unknown as OnapiGraphQLRequest,
              modelsMap,
            ),
            response: completionResponse(response, modelsMap),
          });
        }
        return pre;
      },
      [],
    );
  }
  return [];
};
