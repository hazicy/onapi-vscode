import { StreamLanguage } from "@codemirror/language";
import type { Extension } from "@codemirror/state";

import { normalizeLanguage } from "@/shared/utils/normalizeLanguage";
export { normalizeLanguage };

// Support API editing formats and every generated-code preview language.
// Language parsers are separate chunks, loaded only when an editor needs them.
const loaders: Record<string, () => Promise<Extension>> = {
  typescript: () =>
    import("@codemirror/lang-javascript").then((m) =>
      m.javascript({ typescript: true }),
    ),
  python: () =>
    import("@codemirror/legacy-modes/mode/python").then((m) =>
      StreamLanguage.define(m.python),
    ),
  go: () =>
    import("@codemirror/legacy-modes/mode/go").then((m) =>
      StreamLanguage.define(m.go),
    ),
  php: () => import("@codemirror/lang-php").then((m) => m.php()),
  ruby: () =>
    import("@codemirror/legacy-modes/mode/ruby").then((m) =>
      StreamLanguage.define(m.ruby),
    ),
  swift: () =>
    import("@codemirror/legacy-modes/mode/swift").then((m) =>
      StreamLanguage.define(m.swift),
    ),
  powershell: () =>
    import("@codemirror/legacy-modes/mode/powershell").then((m) =>
      StreamLanguage.define(m.powerShell),
    ),
  r: () =>
    import("@codemirror/legacy-modes/mode/r").then((m) =>
      StreamLanguage.define(m.r),
    ),
  rust: () =>
    import("@codemirror/legacy-modes/mode/rust").then((m) =>
      StreamLanguage.define(m.rust),
    ),
  ocaml: () =>
    import("@codemirror/legacy-modes/mode/mllike").then((m) =>
      StreamLanguage.define(m.oCaml),
    ),
  css: () =>
    import("@codemirror/legacy-modes/mode/css").then((m) =>
      StreamLanguage.define(m.css),
    ),
  cpp: () =>
    import("@codemirror/legacy-modes/mode/clike").then((m) =>
      StreamLanguage.define(m.cpp),
    ),
  java: () =>
    import("@codemirror/legacy-modes/mode/clike").then((m) =>
      StreamLanguage.define(m.java),
    ),
  csharp: () =>
    import("@codemirror/legacy-modes/mode/clike").then((m) =>
      StreamLanguage.define(m.csharp),
    ),
  objectivec: () =>
    import("@codemirror/legacy-modes/mode/clike").then((m) =>
      StreamLanguage.define(m.objectiveC),
    ),
  kotlin: () =>
    import("@codemirror/legacy-modes/mode/clike").then((m) =>
      StreamLanguage.define(m.kotlin),
    ),
  dart: () =>
    import("@codemirror/legacy-modes/mode/clike").then((m) =>
      StreamLanguage.define(m.dart),
    ),
  protobuf: () =>
    import("@codemirror/legacy-modes/mode/protobuf").then((m) =>
      StreamLanguage.define(m.protobuf),
    ),
  json: () => import("@codemirror/lang-json").then((m) => m.json()),
  javascript: () =>
    import("@codemirror/lang-javascript").then((m) => m.javascript()),
  xml: () => import("@codemirror/lang-xml").then((m) => m.xml()),
  html: () => import("@codemirror/lang-html").then((m) => m.html()),
  sql: () => import("@codemirror/lang-sql").then((m) => m.sql()),
  graphql: () => import("cm6-graphql").then((m) => m.graphql()),
  yaml: () =>
    import("@codemirror/legacy-modes/mode/yaml").then((m) =>
      StreamLanguage.define(m.yaml),
    ),
  shell: () =>
    import("@codemirror/legacy-modes/mode/shell").then((m) =>
      StreamLanguage.define(m.shell),
    ),
};

export async function loadLanguage(language: string): Promise<Extension> {
  return loaders[normalizeLanguage(language)]?.() ?? [];
}
