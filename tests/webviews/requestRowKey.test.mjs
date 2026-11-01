import { test } from "node:test";
import assert from "node:assert/strict";
import load, { nativeDependency } from "../helpers/loadTypeScript.mjs";

const { default: RowKey } = await load(
  "apps/webviews/src/shared/components/RequestTable/components/RowKey/RowKey.tsx",
  (id) => {
    if (id === "react")
      return {
        memo: (component) => component,
        useContext: () => ({}),
        useMemo: (callback) => callback(),
      };
    if (id === "react/jsx-runtime")
      return {
        jsx: (type, props) => ({ type, props }),
        jsxs: (type, props) => ({ type, props }),
      };
    if (id === "react-i18next")
      return { useTranslation: () => ({ t: (key) => key }) };
    if (id === "@/shared/ui/base")
      return {
        AutoComplete: "AutoComplete",
        Checkbox: "Checkbox",
        Flex: "Flex",
        Select: "Select",
      };
    if (id === "@/shared/contexts/variable-controls")
      return { useVariableControls: () => ({ Input: "VariableInput" }) };
    if (id.endsWith(".css")) return { default: {} };
    if (id === "../../context") return { default: {} };
    if (id === "@/shared/ui/AppIcon" || id === "@/shared/ui/Tooltip")
      return { default: id };
    if (id.startsWith("@onapi/domain/")) return undefined;
    return nativeDependency(id);
  },
);

function renderInput(key, onChange) {
  const tree = RowKey({
    rowData: { key },
    rowIndex: 0,
    tabType: "query",
    showCheckbox: false,
    showFieldType: false,
    showAiDescription: true,
    onChange,
  });
  return tree.props.children[1].props.children.props;
}

test("blurring an untouched key does not commit an empty or existing row", async () => {
  const changes = [];
  for (const key of [undefined, "", "token"]) {
    await renderInput(key, (...args) => changes.push(args)).onBlur(key || "");
  }
  assert.equal(changes.length, 0);
});

test("key edits and clearing an existing key still commit", async () => {
  const changes = [];
  renderInput("", (...args) => changes.push(args)).onChange("token");
  await renderInput("token", (...args) => changes.push(args)).onBlur("");
  assert.equal(changes.length, 2);
  assert.equal(changes[0][1].key, "token");
  assert.equal(changes[1][1].key, "");
});
