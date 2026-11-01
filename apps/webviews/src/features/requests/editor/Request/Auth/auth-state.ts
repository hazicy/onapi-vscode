// Defaults are part of the auth data, shared by controls and token operations.
const defaults: Record<string, Record<string, unknown>> = {
  apikey: { in: "header" },
  awsv4: { addAuthDataToQuery: false },
  jwt: {
    addTokenTo: "header",
    algorithm: "HS256",
    headerPrefix: "Bearer",
    queryParamKey: "token",
  },
  asap: { alg: "HS256" },
  oauth1: { addParamsToHeader: false },
  oauth2: {
    authRequestParams: [],
    tokenRequestParams: [],
    refreshRequestParams: [],
    addTokenTo: "header",
    headerPrefix: "Bearer",
    grant_type: "password_credentials",
    challengeAlgorithm: "S256",
    client_authentication: "header",
  },
};

type AuthData = Record<string, any> | undefined;
export function readAuthValues(
  auth: AuthData,
  type: string,
): Record<string, any> {
  const stored = auth?.[type];
  const values = Object.fromEntries(
    (Array.isArray(stored) ? stored : []).map(({ key, value }) => [key, value]),
  );
  return { ...defaults[type], ...values };
}

export function updateAuthValues(
  auth: AuthData,
  type: string,
  patch: Record<string, unknown>,
) {
  const attributes = Array.isArray(auth?.[type]) ? auth[type] : [];
  const remaining = { ...readAuthValues(auth, type), ...patch };
  const next = attributes.map((attribute: any) => {
    const value = remaining[attribute.key];
    delete remaining[attribute.key];
    return { ...attribute, value };
  });
  for (const [key, value] of Object.entries(remaining)) {
    next.push({
      key,
      value,
      type: typeof value === "boolean" ? "boolean" : "string",
    });
  }
  return { ...auth, [type]: next };
}

export function validateOAuth2(
  values: Record<string, any>,
): Record<string, string> {
  const grant = values.grant_type || "password_credentials";
  const required =
    grant === "password_credentials"
      ? ["accessTokenUrl", "username", "password"]
      : grant === "client_credentials"
        ? ["accessTokenUrl", "clientId", "clientSecret"]
        : grant === "implicit"
          ? ["redirect_uri", "authUrl", "clientId"]
          : [
              "redirect_uri",
              "authUrl",
              "accessTokenUrl",
              "clientId",
              "clientSecret",
            ];
  return Object.fromEntries(
    required
      .filter(
        (key) =>
          values[key] === null ||
          values[key] === undefined ||
          String(values[key]).trim() === "",
      )
      .map((key) => [key, "Required"]),
  );
}
