import i18next from "i18next";

import { Auth } from "@onapi/domain/requests/types/auth";

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

export enum AUTH_INSERT_VALUE {
  HEADER = "header",
  QUERY = "queryParam",
}

export const AUTH_INHERIT_OPTIONS = [
  {
    get label() {
      return i18next.t("auth.from_parent") || "Inherit auth from parent";
    },
    value: AUTH_ENUM.INHERIT,
  },
];

export const AUTH_OPTIONS = [
  {
    get label() {
      return i18next.t("auth.noauth") || "NO Auth";
    },
    value: AUTH_ENUM.NOAUTH,
  },
  {
    get label() {
      return i18next.t("auth.key_value") || "API Key";
    },
    value: AUTH_ENUM.KV,
  },
  {
    get label() {
      return i18next.t("ui.auth_basic");
    },
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
    get label() {
      return i18next.t("ui.auth_digest");
    },
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

export const DIGEST_ALGORITHM_OPTIONS = [
  "MD5",
  "MD5-sess",
  "SHA-256",
  "SHA-256-sess",
  "SHA-512-256",
  "SHA-512-256-sess",
];

export const HAWK_ALGOTITH_OPTIONS = ["sha256", "sha1"];

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
    get label() {
      return i18next.t("ui.auth_header");
    },
    value: AUTH_INSERT_VALUE.HEADER,
  },
  {
    get label() {
      return i18next.t("ui.auth_query_param");
    },
    value: AUTH_INSERT_VALUE.QUERY,
  },
];

export const AUTH_OAUTH_LOCATION = [
  {
    get label() {
      return i18next.t("ui.auth_headers");
    },
    value: true,
  },
  {
    get label() {
      return i18next.t("ui.auth_body_url");
    },
    value: false,
  },
];

export const AUTH_AWSV4_LOCATION = [
  {
    get label() {
      return i18next.t("ui.auth_headers");
    },
    value: false,
  },
  {
    get label() {
      return i18next.t("ui.auth_url");
    },
    value: true,
  },
];

export const AUTH_APIKEY_LOCATION = [
  {
    get label() {
      return i18next.t("ui.auth_header");
    },
    value: "header",
  },
  {
    get label() {
      return i18next.t("ui.auth_query");
    },
    value: "query",
  },
];

export const AUTH_OAUTH2_LOCATION = [
  {
    get label() {
      return i18next.t("ui.auth_url");
    },
    value: "queryParams",
  },
  {
    get label() {
      return i18next.t("ui.auth_headers");
    },
    value: "header",
  },
];

export const AUTH_OAUTH2_AUTHENTICATION = [
  {
    get label() {
      return i18next.t("ui.auth_basic_header");
    },
    value: "header",
  },
  {
    get label() {
      return i18next.t("ui.auth_body_credentials");
    },
    value: "body",
  },
];

export const AUTH_OAUTH2_CHALLENGE = [
  {
    label: "SHA-256",
    value: "S256",
  },
  {
    get label() {
      return i18next.t("ui.auth_plain");
    },
    value: "plain",
  },
];

export const AUTH_OAUTH2_SEND_IN = [
  {
    get label() {
      return i18next.t("ui.auth_body");
    },
    value: "request_body",
  },
  {
    get label() {
      return i18next.t("ui.auth_url");
    },
    value: "request_url",
  },
  {
    get label() {
      return i18next.t("ui.auth_headers");
    },
    value: "request_header",
  },
];

export const AUTH_OAUTH2_GRANT_TYPE = [
  {
    get label() {
      return i18next.t("ui.auth_code");
    },
    value: "authorization_code",
  },
  {
    get label() {
      return i18next.t("ui.auth_code_pkce");
    },
    value: "authorization_code_with_pkce",
  },
  {
    get label() {
      return i18next.t("ui.auth_password");
    },
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
