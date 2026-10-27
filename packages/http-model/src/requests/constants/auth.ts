import i18next from "i18next";

import { Auth } from "@onapi/http-model/requests/types/auth";

export enum AUTH_ENUM {
  INHERIT = "inherit",
  NOAUTH = "noauth",
  KV = "apikey",
  BEARER = "bearer",
  JWT = "jwt",
  BASIC = "basic",
  DIGEST = "digest",
  OAUTH1 = "oauth1",
  OAUTH2 = "oauth2",
  HAWK = "hawk",
  AWSV4 = "awsv4",
  NTLM = "ntlm",
  EDGEGRID = "edgegrid",
  ASAP = "asap",
}

export const DEFAULT_AUTH_MAP: any = {
  [AUTH_ENUM.INHERIT]: "Inherit auth from parent",
  [AUTH_ENUM.KV]: "API Key",
  [AUTH_ENUM.BEARER]: "Bearer Token",
  [AUTH_ENUM.BASIC]: "Basic auth",
  [AUTH_ENUM.DIGEST]: "Digest auth",
  [AUTH_ENUM.OAUTH1]: "OAuth 1.0",
  [AUTH_ENUM.OAUTH2]: "OAuth 2.0",
  [AUTH_ENUM.HAWK]: "Hawk authentication",
  [AUTH_ENUM.AWSV4]: "AWS Signature",
  [AUTH_ENUM.NTLM]: "NTLM Authentication",
  [AUTH_ENUM.EDGEGRID]: "Akamai EdgeGrid",
  [AUTH_ENUM.JWT]: "JWT Bearer",
  [AUTH_ENUM.ASAP]: "ASAP(Atlassian)",
  [AUTH_ENUM.NOAUTH]: "NO Auth",
};

export enum AUTH_INSERT_VALUE {
  HEADER = "header",
  QUERY = "queryParam",
}

export const AUTH_INHERIT_OPTIONS = [
  {
    label: i18next.t("auth.from_parent") || "Inherit auth from parent",
    value: AUTH_ENUM.INHERIT,
  },
];

export const AUTH_OPTIONS = [
  {
    label: i18next.t("auth.noauth") || "NO Auth",
    value: AUTH_ENUM.NOAUTH,
  },
  {
    label: i18next.t("auth.key_value") || "API Key",
    value: AUTH_ENUM.KV,
  },
  {
    label: "Basic auth",
    value: AUTH_ENUM.BASIC,
  },
  {
    label: "Bearer Token",
    value: AUTH_ENUM.BEARER,
  },
  {
    label: "JWT Bearer",
    value: AUTH_ENUM.JWT,
  },
  {
    label: "Digest auth",
    value: AUTH_ENUM.DIGEST,
  },
  {
    label: "OAuth 1.0",
    value: AUTH_ENUM.OAUTH1,
  },
  {
    label: "OAuth 2.0",
    value: AUTH_ENUM.OAUTH2,
  },
  {
    label: "Hawk authentication",
    value: AUTH_ENUM.HAWK,
  },
  {
    label: "AWS Signature",
    value: AUTH_ENUM.AWSV4,
  },
  {
    label: "NTLM Authentication [Beta]",
    value: AUTH_ENUM.NTLM,
  },
  {
    label: "Akamai EdgeGrid",
    value: AUTH_ENUM.EDGEGRID,
  },
  {
    label: "ASAP(Atlassian)",
    value: AUTH_ENUM.ASAP,
  },
];

export const DEFAULT_AUTH: Partial<Auth> = {
  type: "inherit",
  [AUTH_ENUM.KV]: { key: "", value: "", in: "header" },
  [AUTH_ENUM.BEARER]: { key: "" },
  [AUTH_ENUM.BASIC]: { username: "", password: "" },
  [AUTH_ENUM.DIGEST]: {
    username: "",
    password: "",
    realm: "",
    nonce: "",
    algorithm: "MD5", // default MD5/ emum ['MD5', 'MD5-sess', "SHA-256", "SHA-256-sess", "SHA-512-256" and "SHA-512-256-sess"]
    qop: "", // default auth
    nc: "",
    cnonce: "",
    opaque: "",
    disableRetryRequest: false,
  },
  [AUTH_ENUM.OAUTH1]: {
    consumerKey: "",
    consumerSecret: "",
    signatureMethod: "HMAC-SHA1", // default HMAC-SHA1/ emum ['HMAC-SHA1', 'HMAC-SHA256', 'HMAC-SHA512', 'RSA-SHA1', 'RSA-SHA256', 'RSA-SHA512', 'PLAINTEXT']
    // Currently APIpost supports ['HMAC-SHA1', 'HMAC-SHA256', 'HMAC-SHA512', 'PLAINTEXT']
    addEmptyParamsToSign: true, // Invalid for us
    includeBodyHash: true,
    addParamsToHeader: false,
    realm: "",
    version: "1.0",
    nonce: "",
    timestamp: "",
    verifier: "",
    callback: "",
    tokenSecret: "",
    token: "",
    disableHeaderEncoding: false,
  },
  [AUTH_ENUM.OAUTH2]: {
    addTokenTo: "header",
    headerPrefix: "Bearer",
    access_token: "",
    grant_type: "password_credentials",
    redirect_uri: "",
    authUrl: "",
    accessTokenUrl: "",
    clientId: "",
    clientSecret: "",
    username: "",
    password: "",
    challengeAlgorithm: "S256",
    code_verifier: "Bearer",
    scope: "",
    state: "",
    client_authentication: "header",
    refreshTokenUrl: "",
    authRequestParams: [],
    tokenRequestParams: [],
    refreshRequestParams: [],
  },
  [AUTH_ENUM.HAWK]: {
    authId: "",
    authKey: "",
    algorithm: "", // default sha256/ emum ['sha256', 'sha1']
    user: "",
    nonce: "",
    extraData: "",
    app: "",
    delegation: "",
    timestamp: "",
    includePayloadHash: false,
  },
  [AUTH_ENUM.AWSV4]: {
    accessKey: "",
    secretKey: "",
    region: "", // default us-east-1
    service: "", // default s3
    sessionToken: "",
    addAuthDataToQuery: false,
  },
  [AUTH_ENUM.NTLM]: {
    username: "",
    password: "",
    domain: "",
    workstation: "",
    disableRetryRequest: false,
  },
  [AUTH_ENUM.EDGEGRID]: {
    accessToken: "",
    clientToken: "",
    clientSecret: "",
    nonce: "",
    timestamp: "",
    baseURi: "",
    headersToSign: "",
  },
  [AUTH_ENUM.NOAUTH]: {},
  [AUTH_ENUM.JWT]: {
    addTokenTo: "header",
    algorithm: "HS256",
    secret: "",
    isSecretBase64Encoded: false,
    payload: "",
    headerPrefix: "Bearer",
    queryParamKey: "token",
    header: "",
  },
  [AUTH_ENUM.ASAP]: {
    alg: "HS256",
    iss: "",
    aud: "",
    kid: "",
    privateKey: "",
    sub: "",
    claims: "",
    exp: "",
  },
};

export const digestPlaceholder = {
  username: "Username",
  password: "Password",
  realm: "testrealm@example.com",
  nonce: "Nonce",
  algorithm: "select",
  qop: "e.g. auth-int",
  nc: "e.g. 000000001",
  cnonce: "e.g. 0a4f113b",
  opaque: "Opaque",
};

export const DIGEST_ALGORITHM_OPTIONS = [
  "MD5",
  "MD5-sess",
  "SHA-256",
  "SHA-256-sess",
  "SHA-512-256",
  "SHA-512-256-sess",
];

export const hawkPlaceholder = {
  authId: "Auth Id",
  authKey: "Auth Key",
  algorithm: "select",
  user: "Username",
  nonce: "Nonce",
  extraData: "e.g. some-app-extra-data",
  app: "Application ID",
  delegation: "e.g. delegated-by",
  timestamp: "TimeStamp",
};

export const HAWK_ALGOTITH_OPTIONS = ["sha256", "sha1"];

export const awsPlaceholder = {
  accessKey: "Access Key",
  secretKey: "Secret Key",
  region: "e.g. us-east-1",
  service: "e.g. s3",
  sessionToken: "Session Token",
};

export const ntlmPlacrholder = {
  username: "Username",
  password: "password",
  domain: "e.g. example.com",
  workstation: "e.g. someone-PC",
};

export const edgegridPlaceholder = {
  accessToken: "Access Token",
  clientToken: "Client Token",
  clientSecret: "Client Secret",
  nonce: "Nonce",
  timestamp: "Timestamp",
  baseURi: "Base Url",
  headersToSign: "Header To Sign",
};

export const OAUTH1_METHODS_OPTIONS = [
  "HMAC-SHA1",
  "HMAC-SHA256",
  "HMAC-SHA512",
  "RSA-SHA1",
  "RSA-SHA256",
  "RSA-SHA512",
  "PLAINTEXT",
];

export const AUTH_INSERT_LOCATION = [
  {
    label: "Request Header",
    value: AUTH_INSERT_VALUE.HEADER,
  },
  {
    label: "Query Param",
    value: AUTH_INSERT_VALUE.QUERY,
  },
];

export const AUTH_OAUTH_LOCATION = [
  {
    label: "Request Headers",
    value: true,
  },
  {
    label: "Request Body / Request URL",
    value: false,
  },
];

export const AUTH_AWSV4_LOCATION = [
  {
    label: "Request Headers",
    value: false,
  },
  {
    label: "Request URL",
    value: true,
  },
];

export const AUTH_APIKEY_LOCATION = [
  {
    label: "Header",
    value: "header",
  },
  {
    label: "Query Params",
    value: "query",
  },
];

export const AUTH_OAUTH2_LOCATION = [
  {
    label: "Request URL",
    value: "queryParams",
  },
  {
    label: "Request Headers",
    value: "header",
  },
];

export const AUTH_OAUTH2_AUTHENTICATION = [
  {
    label: "Send as Basic Auth header",
    value: "header",
  },
  {
    label: "Send client credentials in body",
    value: "body",
  },
];

export const AUTH_OAUTH2_CHALLENGE = [
  {
    label: "SHA-256",
    value: "S256",
  },
  {
    label: "Plain",
    value: "plain",
  },
];

export const AUTH_OAUTH2_SEND_IN = [
  {
    label: "Request Body",
    value: "request_body",
  },
  {
    label: "Request URL",
    value: "request_url",
  },
  {
    label: "Request Headers",
    value: "request_header",
  },
];

export const AUTH_OAUTH2_GRANT_TYPE = [
  {
    label: "Authorization Code",
    value: "authorization_code",
  },
  {
    label: "Authorization Code (With PKCE)",
    value: "authorization_code_with_pkce",
  },
  {
    label: "Password Credentials",
    value: "password_credentials",
  },
];

export const AUTH_OAUTH2_GRANT_TYPE_MAP = {
  ["authorization_code"]: "authorization_code",
  ["authorization_code_with_pkce"]: "authorization_code",
  ["password_credentials"]: "password",
};

export const JWT_ALGORITHM_OPTIONS = [
  "HS256",
  "HS384",
  "HS512",
  "RS256",
  "RS384",
  "RS512",
  "PS256",
  "PS384",
  "PS512",
  "ES256",
  "ES384",
  "ES512",
];
