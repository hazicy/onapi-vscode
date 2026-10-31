import { StreamLanguage } from "@codemirror/language";
import type { Extension } from "@codemirror/state";

import { normalizeLanguage } from "@/shared/utils/normalizeLanguage";
export { normalizeLanguage };

// Keep parsers for API editing formats; other code previews use plain text.
// Language parsers are separate chunks, loaded only when an editor needs them.
const loaders: Record<string, () => Promise<Extension>> = {
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
