import type {
  AuthOauth2,
  RequestParamsItem,
} from "@onapi/domain/requests/types/auth";
import { AUTH_OAUTH2_GRANT_TYPE_MAP } from "@onapi/domain/requests/constants/auth";
import {
  resolveOAuth2Parameters,
  resolveOAuth2Variables,
} from "./oauth2-variables";

type Variables = Record<string, string | undefined>;
export type OAuth2TokenSettings = Partial<AuthOauth2>;
type AccessCode = { code?: string; state?: string };

/** Custom parameters keep their original order; later duplicate keys win. */
function partitionParameters(parameters: RequestParamsItem[] = []) {
  const body: Record<string, string> = {};
  const query: Record<string, string> = {};
  const headers: Record<string, string> = {};
  for (const { key, value, send_as } of parameters) {
    const destination =
      send_as === "request_body"
        ? body
        : send_as === "request_url"
          ? query
          : headers;
    destination[key] = value;
  }
  return { body, query, headers };
}

function formRequest(
  url: string | undefined,
  parameters: ReturnType<typeof partitionParameters>,
  body: Record<string, string | undefined>,
) {
  return {
    url: url ?? "",
    data: { ...parameters.body, ...body },
    headers: {
      ...parameters.headers,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    options: { params: parameters.query },
  };
}

export function buildOAuth2TokenRequest(
  settings: OAuth2TokenSettings,
  access: AccessCode = {},
) {
  const grant = settings.grant_type;
  const body: Record<string, string | undefined> = {
    client_id: settings.clientId,
    client_secret: settings.clientSecret,
    redirect_uri: settings.redirect_uri,
    grant_type:
      grant && Object.hasOwn(AUTH_OAUTH2_GRANT_TYPE_MAP, grant)
        ? AUTH_OAUTH2_GRANT_TYPE_MAP[
            grant as keyof typeof AUTH_OAUTH2_GRANT_TYPE_MAP
          ]
        : undefined,
  };
  if (access.code) {
    body.code = access.code;
  }
  if (access.state) {
    body.state = access.state;
  }
  if (grant === "authorization_code_with_pkce") {
    body.code_verifier = settings.code_verifier;
  }
  if (grant === "password_credentials") {
    body.username = settings.username;
    body.password = settings.password;
  }
  return formRequest(
    settings.accessTokenUrl,
    partitionParameters(settings.tokenRequestParams),
    body,
  );
}

export function buildOAuth2RefreshRequest(
  settings: OAuth2TokenSettings,
  refreshToken: string,
) {
  return formRequest(
    settings.refreshTokenUrl,
    partitionParameters(settings.refreshRequestParams),
    {
      refresh_token: refreshToken,
      client_id: settings.clientId,
      client_secret: settings.clientSecret,
      redirect_uri: settings.redirect_uri,
    },
  );
}

/** Capture resolved values before dispatch, without changing the saved auth form. */
export async function resolveOAuth2TokenSettings(
  settings: OAuth2TokenSettings,
  variables: Variables,
): Promise<OAuth2TokenSettings> {
  const resolve = (value?: string) => resolveOAuth2Variables(value, variables);
  const [
    clientId,
    scope,
    state,
    accessTokenUrl,
    clientSecret,
    password,
    username,
    tokenRequestParams,
  ] = await Promise.all([
    resolve(settings.clientId),
    resolve(settings.scope),
    resolve(settings.state),
    resolve(settings.accessTokenUrl),
    resolve(settings.clientSecret),
    resolve(settings.password),
    resolve(settings.username),
    resolveOAuth2Parameters(settings.tokenRequestParams ?? [], variables),
  ]);
  return {
    clientId,
    scope,
    state,
    accessTokenUrl,
    clientSecret,
    password,
    username,
    tokenRequestParams,
    grant_type: settings.grant_type,
  };
}

export async function resolveOAuth2RefreshSettings(
  settings: OAuth2TokenSettings,
  variables: Variables,
): Promise<OAuth2TokenSettings> {
  const resolve = (value?: string) => resolveOAuth2Variables(value, variables);
  const [
    clientId,
    redirect_uri,
    clientSecret,
    refreshTokenUrl,
    refreshRequestParams,
  ] = await Promise.all([
    resolve(settings.clientId),
    resolve(settings.redirect_uri),
    resolve(settings.clientSecret),
    resolve(settings.refreshTokenUrl),
    resolveOAuth2Parameters(settings.refreshRequestParams ?? [], variables),
  ]);
  return {
    clientId,
    redirect_uri,
    clientSecret,
    refreshTokenUrl,
    refreshRequestParams,
  };
}
