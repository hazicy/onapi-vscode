import dayjs from "dayjs";
import i18next from "i18next";
import {
  find,
  includes,
  isArray,
  isDate,
  isEqual,
  isUndefined,
  map,
  size,
  sortBy,
} from "lodash";

import useProjectSetting from "@/features/project/store/useProjectSetting";
import { CustomAttributeItem } from "@onapi/http-model/project/types/index";
import { isJSON } from "@/shared/utils/common";
import { EnvListItem } from "@onapi/http-model/environment/types/index";

// Authentication methods
const authList: { [k: string]: string } = {
  noauth: i18next.t("common.auth.no_auth"),
  kv: i18next.t("common.auth.key_value"),
  bearer: "Bearer Token",
  basic: "Basic auth",
  digest: "Digest auth",
  oauth1: "OAuth 1.0",
  oauth2: "OAuth 2.0",
  hawk: "Hawk authentication",
  awsv4: "AWS Signature",
  ntlm: "NTLM Authentication [Beta]",
  edgegrid: "Akamai EdgeGrid",
  inherit: i18next.t("common.auth.from_parent"),
  jwt: "JWT Bearer",
  asap: "ASAP(Atlassian)",
};

const formatParameters = (parameters: any) =>
  map(parameters, (item) => {
    const { not_null, field_type, key, value, description } = item;
    return {
      [`[${i18next.t("supplement.key")}]key`]: key,
      [`[${i18next.t("supplement.value")}]value`]: value,
      [`[${i18next.t("supplement.file_type")}]field_type`]: field_type,
      [`[${i18next.t("supplement.desc")}]description`]: description,
      [`[${i18next.t("supplement.required")}]not_null`]:
        not_null === 1
          ? i18next.t("supplement.yes")
          : i18next.t("supplement.no"),
    };
  });

const formatAuth = (auth: any) => {
  const _auth: { [k: string]: any } = {
    [`[${i18next.t("supplement.type")}]type`]: authList[auth?.type],
  };

  switch (auth?.type) {
    case "kv":
      _auth[`[${i18next.t("supplement.auth_key")}]kv`] = {
        key: auth?.kv.key,
        value: auth?.kv.value,
      };
      break;
    case "bearer":
      _auth["[Bearer Token]bearer"] = {
        token: auth?.bearer.key,
      };
      break;
    case "basic":
      _auth["[Basic auth]basic"] = {
        username: auth?.basic.username,
        password: auth?.basic.password,
      };
      break;
    case "digest":
      _auth["[Digest auth]digest"] = {
        username: auth?.digest.username,
        password: auth?.digest.password,
        realm: auth?.digest.realm,
        nonce: auth?.digest.nonce,
        algorithm: auth?.digest.algorithm,
        qop: auth?.digest.qop,
        nc: auth?.digest.nc,
        cnonce: auth?.digest.nonce,
        opaque: auth?.digest.opaque,
      };
      break;
    case "oauth1":
      _auth["[OAuth 1.0]oauth1"] = {
        consumerKey: auth?.oauth1.consumerKey,
        consumerSecret: auth?.oauth1.consumerSecret,
        signatureMethod: auth?.oauth1.signatureMethod,
        addEmptyParamsToSign: auth?.oauth1.addEmptyParamsToSign,
        includeBodyHash: auth?.oauth1.includeBodyHash,
        addParamsToHeader: auth?.oauth1.addParamsToHeader,
        realm: auth?.oauth1.realm,
        version: auth?.oauth1.version,
        nonce: auth?.oauth1.nonce,
        timestamp: auth?.oauth1.timestamp,
        verifier: auth?.oauth1.verifier,
        callback: auth?.oauth1.callback,
        tokenSecret: auth?.oauth1.tokenSecret,
        token: auth?.oauth1.token,
      };
      break;
    case "oauth2":
      _auth["[OAuth 2.0]oauth2"] = {
        addTokenTo: auth?.oauth2.addTokenTo,
        headerPrefix: auth?.oauth2.headerPrefix,
        grant_type: auth?.oauth2.grant_type,
        redirect_uri: auth?.oauth2.redirect_uri,
        authUrl: auth?.oauth2.authUrl,
        accessTokenUrl: auth?.oauth2.accessTokenUrl,
        clientId: auth?.oauth2.clientId,
        clientSecret: auth?.oauth2.clientSecret,
        username: auth?.oauth2.username,
        password: auth?.oauth2.password,
        challengeAlgorithm: auth?.oauth2.challengeAlgorithm,
        code_verifier: auth?.oauth2.code_verifier,
        scope: auth?.oauth2.scope,
        state: auth?.oauth2.state,
        client_authentication: auth?.oauth2.client_authentication,
        refreshTokenUrl: auth?.oauth2.refreshTokenUrl,
        authRequestParams: auth?.oauth2.authRequestParams,
        tokenRequestParams: auth?.oauth2.tokenRequestParams,
        refreshRequestParams: auth?.oauth2.refreshRequestParams,
      };
      break;
    case "hawk":
      _auth["[Hawk authentication]hawk"] = {
        authId: auth?.hawk.authId,
        authKey: auth?.hawk.authKey,
        algorithm: auth?.hawk.algorithm,
        user: auth?.hawk.user,
        nonce: auth?.hawk.nonce,
        extraData: auth?.hawk.extraData,
        app: auth?.hawk.app,
        delegation: auth?.hawk.delegation,
        timestamp: auth?.hawk.timestamp,
        includePayloadHash: auth?.hawk.includePayloadHash,
      };
      break;
    case "awsv4":
      _auth["[AWS Signature]awsv4"] = {
        accessKey: auth?.awsv4.accessKey,
        secretKey: auth?.awsv4.accessKey,
        region: auth?.awsv4.accessKey,
        service: auth?.awsv4.accessKey,
        sessionToken: auth?.awsv4.accessKey,
        addAuthDataToQuery: auth?.awsv4.accessKey,
      };
      break;
    case "ntlm":
      _auth["[NTLM Authentication [Beta]]ntlm"] = {
        username: auth?.ntlm.username,
        password: auth?.ntlm.password,
        domain: auth?.ntlm.domain,
        workstation: auth?.ntlm.workstation,
        disableRetryRequest: auth?.ntlm.disableRetryRequest,
      };
      break;
    case "edgegrid":
      _auth["[Akamai EdgeGrid]edgegrid"] = {
        accessToken: auth?.edgegrid.accessToken,
        clientToken: auth?.edgegrid.clientToken,
        clientSecret: auth?.edgegrid.clientSecret,
        nonce: auth?.edgegrid.nonce,
        timestamp: auth?.edgegrid.timestamp,
        baseURi: auth?.edgegrid.baseURi,
        headersToSign: auth?.edgegrid.headersToSign,
      };
      break;
    case "jwt":
      _auth["[JWT Bearer]jwt"] = {
        addTokenTo: auth?.jwt.addTokenTo,
        algorithm: auth?.jwt.algorithm,
        secret: auth?.jwt.secret,
        isSecretBase64Encoded: auth?.jwt.isSecretBase64Encoded,
        payload: auth?.jwt.payload,
        headerPrefix: auth?.jwt.headerPrefix,
        queryParamKey: auth?.jwt.queryParamKey,
        header: auth?.jwt.header,
      };
      break;
    case "asap":
      _auth["[ASAP(Atlassian)]asap"] = {
        alg: auth?.asap.alg,
        iss: auth?.asap.iss,
        aud: auth?.asap.aud,
        kid: auth?.asap.kid,
        privateKey: auth?.asap.privateKey,
        sub: auth?.asap.sub,
        claims: auth?.asap.claims,
        exp: auth?.asap.exp,
      };
      break;
    default:
      break;
  }
  return _auth;
};

// Compare
export const compare = (prevObj: any, nextObj: any, title: string) => {
  const diff = !isEqual(prevObj, nextObj);
  return {
    [`${title}_diff`]: diff,
    [`prev_${title}`]: prevObj,
    [`next_${title}`]: nextObj,
  };
};
// Get status
const getMark = (mark_id: string) => {
  const { markList } = useProjectSetting.getState();
  return markList.find((item) => item.mark_id === mark_id)?.name || "";
};

// Get attributes
const getAttr = (value: any) => {
  const { customAttributeList: interfaceProperties } =
    useProjectSetting.getState();
  const result: any = {};
  Object.keys(value || {}).map((id) => {
    const item = find(
      interfaceProperties,
      (it: CustomAttributeItem) => it.attribute_id == id,
    );
    const key: string = `${item?.field_name || ""}[${id}]`;
    if (isArray(value[id])) {
      result[key] = value[id].map(
        (it: string) => find(item?.extra, (a) => it == a.key)?.value || it,
      );
    } else if (dayjs.isDayjs(value[id]) || isDate(value[id])) {
      result[key] = dayjs(value[id]).format("YYYY-MM-DD HH:mm:ss");
    } else {
      result[key] =
        find(item?.extra, (a) => value[id] == a.key)?.value || value[id];
    }
  });
  return result;
};

export const formatEnv = (data: EnvListItem) => {
  const { name: envName, server_list, env_var_list } = data || {};

  const base_info = {
    [`[Environment Name]name`]: envName || "",
  };

  const _server_list = map(server_list, (item) => {
    const { name, uri } = item;
    return {
      [`[Server Name]key`]: name,
      [`[Base URL]value`]: uri,
    };
  });

  const _env_var_list = map(env_var_list, (item, key) => {
    const { value, description, current_value } = item;
    return {
      [`[Variables]key`]: key,
      [`[Cloud Value]value`]: value,
      [`[Description]description`]: description,
    };
  });

  return {
    base_info,
    server_list: _server_list,
    env_var_list: _env_var_list,
  } as any;
};

export const formatApis = (data: any) => {
  const {
    name,
    method,
    mark_id,
    attribute_info,
    tags,
    url,
    request,
    response,
    description,
  } = data || {};

  const { header, query, restful, cookie, auth, body, pre_tasks, post_tasks } =
    request || {};

  const base_info = {
    [`[${i18next.t("supplement.name")}]name`]: name || "",
    [`[${i18next.t("supplement.status")}]mark`]: getMark(mark_id),
    [`[${i18next.t("supplement.tag")}]tag`]: tags || [],
    [`[${i18next.t("supplement.attr")}]attribute_info`]:
      getAttr(attribute_info),
  };
  if (!isUndefined(method)) {
    base_info["[Method]method"] = method;
  }
  if (!isUndefined(url)) {
    base_info["[URL]url"] = url || "";
  }

  const _header = formatParameters(header?.parameter);
  const _query = formatParameters(query?.parameter);
  const _restful = formatParameters(restful?.parameter);
  const _cookie = formatParameters(cookie?.parameter);
  // Body type displays differently
  const _bodyParameter = formatParameters(body?.parameter);
  const _body: any = {
    [`[${i18next.t("supplement.type")}]mode`]: body?.mode,
  };
  if (body?.mode === "form-data" || body?.mode === "urlencoded") {
    _body[`[${i18next.t("grpc.grpc_debug.add_arg")}]parameter`] =
      _bodyParameter;
  }
  if (includes(["json", "xml", "javascript", "msgpack"], body?.mode)) {
    _body[`[${i18next.t("supplement.request")}]raw`] = body?.raw
      ? isJSON(body?.raw)
        ? JSON.parse(body?.raw)
        : body?.raw
      : "";
    _body[`[${i18next.t("supplement.schema")}]raw_schema`] = body?.raw_schema
      ? isJSON(body?.raw_schema)
        ? JSON.parse(body?.raw_schema)
        : body?.raw_schema
      : "";
  }
  if (body?.mode === "plain" || body?.mode === "html") {
    _body[`[${i18next.t("supplement.request")}]raw`] = body?.raw
      ? isJSON(body?.raw)
        ? JSON.parse(body?.raw)
        : body?.raw
      : "";
  }
  if (body?.mode === "binary") {
    _body[`[${i18next.t("supplement.req")}]binary`] = body?.binary
      ? isJSON(body?.binary)
        ? JSON.parse(body?.binary)
        : body?.binary
      : "";
  }

  // Body type displays differently
  const _auth = formatAuth(auth);
  const responseValues = sortBy(
    Object.values(response?.example || {}),
    "expect.name",
  );
  let _response: any = [];
  if (size(responseValues) > 0) {
    _response = map(responseValues, (it) => {
      const { expect, raw, parameter } = it || ({} as any);
      const key = `[${expect?.name || ""}](${expect?.code || ""})`;
      return {
        [key]: {
          [`[${i18next.t("supplement.response")}]raw`]: raw
            ? isJSON(raw)
              ? JSON.parse(raw)
              : raw
            : "",
          [`[${i18next.t("supplement.response")}]parameter`]: map(
            parameter,
            (item) => ({
              [`[${i18next.t("supplement.key")}]key`]: item?.key,
              [`[${i18next.t("supplement.value")}]value`]: item?.value,
              [`[${i18next.t("supplement.file_type")}]field_type`]:
                item?.field_type,
              [`[${i18next.t("supplement.desc")}]description`]:
                item?.description,
              [`[${i18next.t("supplement.required")}]not_null`]:
                item?.not_null === 1
                  ? i18next.t("supplement.yes")
                  : i18next.t("supplement.no"),
            }),
          ),
          [`[${i18next.t("supplement.response")}]jsonSchema`]: expect?.schema
            ? isJSON(expect?.schema)
              ? JSON.parse(expect?.schema)
              : expect?.schema
            : "",
        },
      };
    });
  }
  return {
    base_info,
    description,
    header: _header,
    query: _query,
    restful: _restful,
    cookie: _cookie,
    body: _body,
    auth: _auth,
    pre_tasks,
    post_tasks,
    response: _response,
  } as any;
};

export const formatWebSocket = (data: any) => {
  const {
    name,
    mark_id,
    attribute_info,
    tags,
    url,
    request,
    message,
    description,
  } = data || {};

  const { header, query } = request || {};

  const base_info = {
    [`[${i18next.t("supplement.name")}]name`]: name || "",
    [`[${i18next.t("supplement.status")}]mark`]: getMark(mark_id),
    [`[${i18next.t("supplement.tag")}]tag`]: tags || [],
    [`[${i18next.t("supplement.attr")}]attribute_info`]:
      getAttr(attribute_info),
  };

  if (!isUndefined(url)) {
    base_info["[URL]url"] = url || "";
  }

  const _header = formatParameters(header?.parameter);
  const _query = formatParameters(query?.parameter);

  // Body type displays differently

  let _message: any = [];
  if (size(message) > 0) {
    _message = map(message, (it) => {
      const { response, request, name, param_id } = it || ({} as any);
      const key = `${name}[${param_id}]`;
      return {
        [key]: {
          [`[${i18next.t("supplement.req")}]`]: {
            [`[${i18next.t("supplement.req")}]raw`]: request?.raw
              ? isJSON(request?.raw)
                ? JSON.parse(request?.raw)
                : request?.raw
              : "",
            [`[${i18next.t("supplement.req")}]parameter`]: map(
              request?.raw_parameter,
              (item) => ({
                [`[${i18next.t("supplement.key")}]key`]: item?.key,
                [`[${i18next.t("supplement.value")}]value`]: item?.value,
                [`[${i18next.t("supplement.file_type")}]field_type`]:
                  item?.field_type,
                [`[${i18next.t("supplement.desc")}]description`]:
                  item?.description,
                [`[${i18next.t("supplement.required")}]not_null`]:
                  item?.not_null === 1
                    ? i18next.t("supplement.yes")
                    : i18next.t("supplement.no"),
              }),
            ),
            [`[${i18next.t("supplement.req")}]jsonSchema`]: request?.raw_schema
              ? isJSON(request?.raw_schema)
                ? JSON.parse(request?.raw_schema)
                : request?.raw_schema
              : "",
          },
          [`[${i18next.t("supplement.res")}]`]: {
            [`[${i18next.t("supplement.res")}]raw`]: response?.raw
              ? isJSON(response?.raw)
                ? JSON.parse(response?.raw)
                : response?.raw
              : "",
            [`[${i18next.t("supplement.res")}]parameter`]: map(
              response?.raw_parameter,
              (item) => ({
                [`[${i18next.t("supplement.key")}]key`]: item?.key,
                [`[${i18next.t("supplement.value")}]value`]: item?.value,
                [`[${i18next.t("supplement.file_type")}]field_type`]:
                  item?.field_type,
                [`[${i18next.t("supplement.desc")}]description`]:
                  item?.description,
                [`[${i18next.t("supplement.required")}]not_null`]:
                  item?.not_null === 1
                    ? i18next.t("supplement.yes")
                    : i18next.t("supplement.no"),
              }),
            ),
            [`[${i18next.t("supplement.res")}]jsonSchema`]: response?.raw_schema
              ? isJSON(response?.raw_schema)
                ? JSON.parse(response?.raw_schema)
                : response?.raw_schema
              : "",
          },
        },
      };
    });
  }
  return {
    base_info,
    description,
    header: _header,
    query: _query,
    message: _message,
  } as any;
};

export const formatSocketIo = (data: any) => {
  const {
    name,
    mark_id,
    attribute_info,
    tags,
    url,
    request,
    message,
    description,
  } = data || {};

  const { header, query, event } = request || {};

  const base_info = {
    [`[${i18next.t("supplement.name")}]name`]: name || "",
    [`[${i18next.t("supplement.status")}]mark`]: getMark(mark_id),
    [`[${i18next.t("supplement.tag")}]tag`]: tags || [],
    [`[${i18next.t("supplement.attr")}]attribute_info`]:
      getAttr(attribute_info),
  };

  if (!isUndefined(url)) {
    base_info["[URL]url"] = url || "";
  }

  const _header = formatParameters(header?.parameter);
  const _query = formatParameters(query?.parameter);

  const _event = map(event?.parameter, (item) => {
    const { key, value, description } = item;
    return {
      [`[${i18next.t("supplement.event_name")}]key`]: key,
      [`[${i18next.t("supplement.listen")}]listen`]: isEqual(value, "1"),
      [`[${i18next.t("supplement.event_desc")}]description`]: description,
    };
  });
  // Body type displays differently

  let _message: any = [];
  if (size(message) > 0) {
    _message = map(message, (it) => {
      const { response, request, name, param_id } = it || ({} as any);
      const key = `${name}[${param_id}]`;
      return {
        [key]: {
          [`[${i18next.t("supplement.req")}]`]: {
            [`[${i18next.t("supplement.req")}]raw`]: request?.raw
              ? isJSON(request?.raw)
                ? JSON.parse(request?.raw)
                : request?.raw
              : "",
            [`[${i18next.t("supplement.req")}]parameter`]: map(
              request?.raw_parameter,
              (item) => ({
                [`[${i18next.t("supplement.key")}]key`]: item?.key,
                [`[${i18next.t("supplement.value")}]value`]: item?.value,
                [`[${i18next.t("supplement.file_type")}]field_type`]:
                  item?.field_type,
                [`[${i18next.t("supplement.desc")}]description`]:
                  item?.description,
                [`[${i18next.t("supplement.required")}]not_null`]:
                  item?.not_null === 1
                    ? i18next.t("supplement.yes")
                    : i18next.t("supplement.no"),
              }),
            ),
            [`[${i18next.t("supplement.req")}]jsonSchema`]: request?.raw_schema
              ? isJSON(request?.raw_schema)
                ? JSON.parse(request?.raw_schema)
                : request?.raw_schema
              : "",
          },
          [`[${i18next.t("supplement.res")}]`]: {
            [`[${i18next.t("supplement.res")}]raw`]: response?.raw
              ? isJSON(response?.raw)
                ? JSON.parse(response?.raw)
                : response?.raw
              : "",
            [`[${i18next.t("supplement.res")}]parameter`]: map(
              response?.raw_parameter,
              (item) => ({
                [`[${i18next.t("supplement.key")}]key`]: item?.key,
                [`[${i18next.t("supplement.value")}]value`]: item?.value,
                [`[${i18next.t("supplement.file_type")}]field_type`]:
                  item?.field_type,
                [`[${i18next.t("supplement.desc")}]description`]:
                  item?.description,
                [`[${i18next.t("supplement.required")}]not_null`]:
                  item?.not_null === 1
                    ? i18next.t("supplement.yes")
                    : i18next.t("supplement.no"),
              }),
            ),
            [`[${i18next.t("supplement.res")}]jsonSchema`]: response?.raw_schema
              ? isJSON(response?.raw_schema)
                ? JSON.parse(response?.raw_schema)
                : response?.raw_schema
              : "",
          },
        },
      };
    });
  }
  return {
    base_info,
    description,
    header: _header,
    query: _query,
    event: _event,
    message: _message,
  } as any;
};

export const formatGraphql = (data: any) => {
  const {
    name,
    method,
    mark_id,
    attribute_info,
    tags,
    url,
    request,
    description,
  } = data || {};

  const { header, cookie, auth, body, pre_tasks, post_tasks } = request || {};

  const base_info = {
    [`[${i18next.t("supplement.name")}]name`]: name || "",
    [`[${i18next.t("supplement.status")}]mark`]: getMark(mark_id),
    [`[${i18next.t("supplement.tag")}]tag`]: tags || [],
    [`[${i18next.t("supplement.attr")}]attribute_info`]:
      getAttr(attribute_info),
  };
  if (!isUndefined(method)) {
    base_info["[Method]method"] = method;
  }
  if (!isUndefined(url)) {
    base_info["[URL]url"] = url || "";
  }

  const _header = formatParameters(header?.parameter);

  const _cookie = formatParameters(cookie?.parameter);
  // body query_list
  let _query_list = [];
  _query_list = map(body?.query_list, (it) => {
    const { name, query, variables } = it || ({} as any);
    return {
      [`[${i18next.t("supplement.name")}]name`]: name,
      ["[Query]query"]: query
        ? isJSON(query)
          ? JSON.parse(query)
          : query
        : "",
      ["[Variables]variables"]: variables
        ? isJSON(variables)
          ? JSON.parse(variables)
          : variables
        : "",
    };
  });
  const _auth = formatAuth(auth);

  return {
    base_info,
    description,
    header: _header,
    cookie: _cookie,
    query: _query_list,
    auth: _auth,
    pre_tasks,
    post_tasks,
  } as any;
};
