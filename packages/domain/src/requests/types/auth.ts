// Request auth type
export type AuthType =
  | "inherit" // No auth required
  | "noauth" // No auth required
  | "apikey" // API key
  | "bearer" // 'Bearer Token',
  | "basic" // 'Basic auth',
  | "digest" // Digest auth
  | "oauth1" // Digest auth
  | "oauth2" // 'OAuth 1.0',
  | "hawk" // 'Hawk authentication',
  | "awsv4" // 'AWS Signature',
  | "ntlm" // 'NTLM Authentication [Beta]',
  | "edgegrid" // Akamai EdgeGrid', // edgegrid
  | "jwt" // JWT Bearer
  | "asap"; // ASAP(Atlassian)

export type AuthBasic = {
  username: string;
  password: string;
};

export type AuthBearer = {
  key: string;
};

export type AuthKv = {
  key: string;
  value: string;
  in: string;
};

export type AuthDigest = {
  username: string;
  password: string;
  realm: string;
  nonce: string;
  algorithm: string;
  qop: string;
  nc: string;
  cnonce: string;
  opaque: string;
  disableRetryRequest: boolean;
};

export type AuthHawk = {
  authId: string;
  authKey: string;
  algorithm: string;
  user: string;
  nonce: string;
  extraData: string;
  app: string;
  delegation: string;
  timestamp: string;
  includePayloadHash: boolean;
};

export type AuthAwsv4 = {
  accessKey: string;
  secretKey: string;
  region: string;
  service: string;
  sessionToken: string;
  addAuthDataToQuery: boolean;
};

export type AuthNtlm = {
  username: string;
  password: string;
  domain: string;
  workstation: string;
  disableRetryRequest: boolean;
};

export type AuthEdgegrid = {
  accessToken: string;
  clientToken: string;
  clientSecret: string;
  nonce: string;
  timestamp: string;
  baseURi: string;
  headersToSign: string;
};

export type AuthOauth1 = {
  consumerKey: string;
  consumerSecret: string;
  signatureMethod: string;
  addEmptyParamsToSign: boolean;
  includeBodyHash: boolean;
  addParamsToHeader: boolean;
  realm: string;
  version: string;
  nonce: string;
  timestamp: string;
  verifier: string;
  callback: string;
  tokenSecret: string;
  token: string;
  disableHeaderEncoding: boolean;
};

export type RequestParamsItem = {
  key: string;
  value: string;
  enabled: boolean;
  send_as: string;
  param_id: string;
};

export type AuthOauth2 = {
  addTokenTo: string;
  headerPrefix: string;
  access_token: string;
  grant_type: string;
  redirect_uri: string;
  authUrl: string;
  accessTokenUrl: string;
  clientId: string;
  clientSecret: string;
  username?: string;
  password?: string;
  challengeAlgorithm?: string;
  code_verifier?: string;
  scope: string;
  state: string;
  client_authentication: string;
  refreshTokenUrl: string;
  authRequestParams: RequestParamsItem[];
  tokenRequestParams: RequestParamsItem[];
  refreshRequestParams: RequestParamsItem[];
};

export type AuthJwt = {
  addTokenTo: string;
  algorithm: string;
  secret: string;
  isSecretBase64Encoded: boolean;
  payload: string;
  headerPrefix: string;
  queryParamKey: string;
  header: string;
};

export type AuthAsap = {
  alg: string;
  iss: string;
  aud: string;
  kid: string;
  privateKey: string;
  sub: string;
  claims: string;
  exp: string;
};

export interface Auth {
  basic?: AuthBasic;
  bearer?: AuthBearer;
  apikey?: AuthKv;
  type?: AuthType;
  digest?: AuthDigest;
  hawk?: AuthHawk;
  awsv4?: AuthAwsv4;
  ntlm?: AuthNtlm;
  edgegrid?: AuthEdgegrid;
  oauth1?: AuthOauth1;
  oauth2?: AuthOauth2;
  noauth?: Record<string, any>;
  inherit?: Record<string, any>;
  jwt?: AuthJwt;
  asap?: AuthAsap;
}
