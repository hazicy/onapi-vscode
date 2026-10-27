import { test } from "node:test";
import assert from "node:assert/strict";
import load from "./helpers/loadTypeScript.mjs";
const { indexTree, treeChecks, toggleTreeCheck, nodeText } = await load(
  "apps/webviews/src/shared/ui/base/treeData.ts",
);
const plain = (value) => JSON.parse(JSON.stringify(value));

test("custom keys and explicit empty folders preserve original data and stable positions", () => {
  const data = [
    { id: 1, name: "Folder", items: [{ id: 2, name: "Child" }] },
    { id: 3, name: "Empty", items: [] },
  ];
  const original = structuredClone(data);
  const { nodes } = indexTree(data, {
    key: "id",
    title: "name",
    children: "items",
  });
  assert.equal(nodes.get("1").folder, true);
  assert.equal(nodes.get("2").folder, false);
  assert.equal(nodes.get("3").folder, true);
  assert.equal(nodes.get("2").pos, "0-0-0");
  assert.equal(nodes.get("2").key, 2);
  assert.deepEqual(data, original);
});

test("checking a nested parent propagates to descendants and unchecking prunes ancestor checks", () => {
  const { nodes } = indexTree([
    {
      key: "root",
      children: [
        { key: "nested", children: [{ key: "a" }, { key: "b" }] },
        { key: "c" },
      ],
    },
  ]);
  const checked = toggleTreeCheck(nodes, [], "root");
  assert.deepEqual(
    new Set(plain(checked.checked)),
    new Set(["root", "nested", "a", "b", "c"]),
  );
  const partial = toggleTreeCheck(nodes, checked.checked, "a");
  assert.deepEqual(plain(partial.checked).sort(), ["b", "c"]);
  assert.deepEqual(plain(partial.half).sort(), ["nested", "root"]);
});

test("disabled checkbox branches form propagation boundaries", () => {
  const { nodes } = indexTree([
    {
      key: "root",
      children: [
        { key: "a" },
        { key: "disabled", disabled: true, children: [{ key: "b" }] },
      ],
    },
  ]);
  const checked = toggleTreeCheck(nodes, [], "root");
  assert.deepEqual(plain(checked.checked).sort(), ["a", "root"]);
  const unchanged = toggleTreeCheck(nodes, checked.checked, "disabled");
  assert.deepEqual(
    plain(unchanged.checked).sort(),
    plain(checked.checked).sort(),
  );
  assert.deepEqual(plain(unchanged.half), plain(checked.half));
  assert.deepEqual(plain(treeChecks(nodes, ["b"]).half), []);
});

test("strict checking keeps parent and child independent", () => {
  const { nodes } = indexTree([{ key: "root", children: [{ key: "child" }] }]);
  assert.deepEqual(plain(toggleTreeCheck(nodes, [], "root", true)), {
    checked: ["root"],
    half: [],
  });
  assert.deepEqual(plain(treeChecks(nodes, ["child"], true)), {
    checked: ["child"],
    half: [],
  });
});

test("custom title components expose their displayed names to tree navigation", () => {
  assert.equal(nodeText({ props: { name: "Get users" } }), "Get users");
  assert.equal(
    nodeText({ props: { children: ["Get", " ", "users"] } }),
    "Get users",
  );
});
