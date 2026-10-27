export function normalizeLanguage(language = "text") {
  const name = language.toLowerCase();
  return (
    (
      {
        js: "javascript",
        node: "javascript",
        ts: "typescript",
        jsonc: "json",
        htm: "html",
        yml: "yaml",
        sh: "shell",
        bash: "shell",
        curl: "shell",
        py: "python",
        c: "cpp",
        "c++": "cpp",
        "c#": "csharp",
        cs: "csharp",
        "objective-c": "objectivec",
        plaintext: "text",
        txt: "text",
      } as Record<string, string>
    )[name] || name
  );
}
