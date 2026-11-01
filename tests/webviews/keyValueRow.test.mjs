import { test } from "node:test";
import assert from "node:assert/strict";
import load, { nativeDependency } from "../helpers/loadTypeScript.mjs";

class Input {
  getAttribute() {
    return null;
  }
}
const { default: Row } = await load(
  "apps/webviews/src/shared/components/RequestTable/components/KeyValueRow.tsx",
  (id) => {
    if (id === "react") return { memo: (component) => component };
    if (id === "react/jsx-runtime")
      return {
        jsx: (type, props) => ({ type, props }),
        jsxs: (type, props) => ({ type, props }),
      };
    if (id === "react-i18next")
      return { useTranslation: () => ({ t: (key) => key }) };
    if (id === "@dnd-kit/sortable")
      return { useSortable: () => ({ transform: null }) };
    if (id === "@/shared/ui/base") return { Checkbox: "Checkbox" };
    if (id === "@/shared/ui/AppIcon") return { default: "AppIcon" };
    if (id.endsWith(".css")) return { default: {} };
    return nativeDependency(id);
  },
  { HTMLInputElement: Input, requestAnimationFrame: (callback) => callback() },
);

test("the placeholder add button creates a row and focuses its key", () => {
  let added = 0;
  let focused = 0;
  const tree = Row({ id: "draft", placeholderRow: true, onAdd: () => added++ });
  const button = tree.props.children[0].props.children;
  assert.equal(button.type, "button");
  assert.equal(button.props.disabled, false);
  button.props.onClick({
    currentTarget: {
      closest: () => ({ querySelector: () => ({ focus: () => focused++ }) }),
    },
  });
  assert.equal(added, 1);
  assert.equal(focused, 1);
});

function pressEnter(props = {}, overrides = {}) {
  let focused = 0;
  let prevented = 0;
  const tree = Row({ id: "row", keyEditor: null, ...props });
  tree.props.onKeyDown({
    key: "Enter",
    nativeEvent: {},
    target: new Input(),
    currentTarget: {
      closest: () => ({ querySelector: () => ({ focus: () => focused++ }) }),
    },
    preventDefault: () => prevented++,
    stopPropagation() {},
    ...overrides,
  });
  return { focused, prevented };
}

test("Enter advances a saved parameter to the placeholder without creating rows", () => {
  assert.deepEqual(pressEnter(), { focused: 1, prevented: 1 });
  assert.deepEqual(pressEnter({ placeholderRow: true }), {
    focused: 0,
    prevented: 1,
  });
});

test("Enter leaves composition, modifiers, read-only inputs and open suggestions alone", () => {
  for (const overrides of [
    { nativeEvent: { isComposing: true } },
    { shiftKey: true },
    { ctrlKey: true },
    { metaKey: true },
    { altKey: true },
    { target: Object.assign(new Input(), { readOnly: true }) },
    { target: Object.assign(new Input(), { getAttribute: () => "true" }) },
  ])
    assert.deepEqual(pressEnter({}, overrides), { focused: 0, prevented: 0 });
  assert.deepEqual(pressEnter({ readOnly: true }), {
    focused: 0,
    prevented: 0,
  });
});
