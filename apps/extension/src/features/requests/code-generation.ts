import codegen from "postman-code-generators";
import type { Request } from "postman-collection";

export const getCodeLanguages = () => codegen.getLanguageList();

export function selectCodeLanguage(language?: string, variant?: string) {
  const languages = getCodeLanguages();
  // Migrate the most common selections from har2languages.
  const aliases: Record<string, string> = { node: "nodejs", shell: "curl" };
  const key =
    language === "shell" && variant !== "curl"
      ? "shell"
      : aliases[language || ""] || language;
  const target = languages.find((item) => item.key === key);
  const choice = target?.variants.find(
    (item) => item.key.toLowerCase() === variant?.toLowerCase(),
  );
  if (target && choice) {
    return {
      language: target.key,
      variant: choice.key,
      syntax: ["curl", "shell"].includes(target.key)
        ? "shell"
        : target.syntax_mode,
    };
  }
  return { language: "curl", variant: "cURL", syntax: "sh" };
}

export async function generateRequestCode(
  source: Request,
  language: string,
  variant: string,
): Promise<string> {
  // Keep the URL encoding intact; decoding generated source can change request semantics.
  const { default: sdk } = await import("postman-collection");
  const request = new sdk.Request(source.toJSON());
  request.url.hash = undefined;
  request.headers.each((header) => {
    header.value = String(header.value ?? "");
  });
  const graphql =
    request.body?.mode === "graphql" ? request.body.graphql : undefined;
  if (graphql && typeof graphql.variables !== "string") {
    graphql.variables = JSON.stringify(graphql.variables || {});
  }
  return new Promise((resolve, reject) => {
    codegen.convert(language, variant, request, {}, (error, snippet) => {
      if (error) {
        reject(error);
      } else {
        resolve(snippet);
      }
    });
  });
}
