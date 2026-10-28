declare const __ONAPI_LANGUAGE__: "auto" | "en" | "zh-cn";

declare module "curl-to-postmanv2";

declare module "postman-code-generators" {
  interface CodeLanguage {
    key: string;
    label: string;
    syntax_mode: string;
    variants: { key: string }[];
  }
  const codegen: {
    getLanguageList(): CodeLanguage[];
    convert(
      language: string,
      variant: string,
      request: import("postman-collection").Request,
      options: Record<string, unknown>,
      callback: (error: Error | null, snippet: string) => void,
    ): void;
  };
  export default codegen;
}
