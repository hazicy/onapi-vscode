import { test } from "node:test";
import assert from "node:assert/strict";
import load from "./helpers/loadTypeScript.mjs";
import { nativeDependency } from "./helpers/loadTypeScript.mjs";
let nextId = 0;
let activeRefs;
let refIndex;
const { default: Table } = await load(
  "apps/webviews/src/features/requests/editor/Request/Auth/components/Oauth2ParamsTable.tsx",
  (id) => {
    if (id === "react")
      return {
        useMemo: (callback) => callback(),
        useRef: (initial) => {
          const index = refIndex++;
          activeRefs[index] ||= { current: initial };
          return activeRefs[index];
        },
      };
    if (id === "react/jsx-runtime")
      return {
        jsx: (type, props) => ({ type, props }),
        jsxs: (type, props) => ({ type, props }),
      };
    if (id === "@onapi/domain/utils/data-tools")
      return { snowflakeId: () => `id-${++nextId}` };
    if (id === "@dnd-kit/sortable") return nativeDependency(id);
    if (id === "@/shared/ui/base")
      return { Checkbox: "Checkbox", Flex: "Flex", Select: "Select" };
    if (id === "@/shared/components") return { BasicTable: "BasicTable" };
    if (id === "@/features/variables/components/VarInput/VarInput")
      return "VarInput";
    if (id === "@onapi/domain/requests/constants/auth")
      return { AUTH_OAUTH2_SEND_IN: [] };
    throw new Error(`Unexpected dependency ${id}`);
  },
);
const createTable = () => {
  const refs = [];
  return (props) => {
    activeRefs = refs;
    refIndex = 0;
    return Table(props).props;
  };
};
const row = (id) => ({
  key: id,
  value: "value",
  send_as: "request_body",
  enabled: true,
  param_id: id,
});
test("placeholder IDs are stable per table and isolated across table instances", () => {
  const renderA = createTable();
  const renderB = createTable();
  const first = renderA({ value: [] }).dataSource[0];
  const other = renderB({ value: [row("saved")] }).dataSource.at(-1);
  assert.notEqual(first.param_id, other.param_id);
  assert.equal(renderA({ value: [] }).dataSource[0].param_id, first.param_id);
  assert.equal(first.static, true);
});
test("editing a placeholder appends a real row without changing its input and creates one new placeholder", () => {
  const render = createTable();
  let changed;
  const view = render({
    value: [],
    onChange: (value) => {
      changed = value;
    },
  });
  const blank = view.dataSource[0];
  view.columns[1].render("", blank, 0).props.onChange("name");
  assert.equal(blank.static, true);
  assert.equal(blank.key, "");
  assert.equal(changed[0].static, undefined);
  assert.equal(changed[0].key, "name");
  const next = render({ value: changed });
  assert.equal(next.dataSource.length, 2);
  assert.notEqual(next.dataSource[1].param_id, blank.param_id);
  assert.equal(
    render({ value: changed }).dataSource[1].param_id,
    next.dataSource[1].param_id,
  );
});
test("editing existing rows preserves the original controlled array", () => {
  const render = createTable();
  const input = [row("saved")];
  let changed;
  const view = render({
    value: input,
    onChange: (value) => {
      changed = value;
    },
    hasSendIn: true,
  });
  view.columns[2].render("value", input[0], 0).props.onChange("new value");
  assert.equal(input[0].value, "value");
  assert.equal(changed[0].value, "new value");
  assert.equal(view.columns.length, 4);
});
test("cancelled or invalid drags do nothing and valid drags preserve input ordering", () => {
  const render = createTable();
  const input = [row("a"), row("b")];
  const calls = [];
  const view = render({ value: input, onChange: (value) => calls.push(value) });
  for (const over of [
    null,
    { id: "unknown" },
    { id: view.dataSource.at(-1).param_id },
  ]) {
    view.onDragEnd({ active: { id: "a" }, over });
  }
  view.onDragEnd({ active: { id: "unknown" }, over: { id: "a" } });
  assert.equal(calls.length, 0);
  view.onDragEnd({ active: { id: "a" }, over: { id: "b" } });
  assert.deepEqual(
    calls[0].map((item) => item.param_id),
    ["b", "a"],
  );
  assert.deepEqual(
    input.map((item) => item.param_id),
    ["a", "b"],
  );
});
