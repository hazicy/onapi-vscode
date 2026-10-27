import { test } from "node:test";
import assert from "node:assert/strict";
import loadTypeScript from "./helpers/loadTypeScript.mjs";
const { getCollectionChildIds, getCollectionApis } = await loadTypeScript(
  "apps/extension/src/features/collections/collection-tree.ts",
  () => {
    throw new Error("Unexpected runtime dependency");
  },
);
const item = (id, parent, type = "api", sort = 1) => ({
  id: id,
  parentId: parent,
  kind: type,
  sort,
});
const ids = (rows) => Array.from(rows, (row) => row.id);
test("deletion uses collection order and includes every request type under folders", () => {
  const root = item("root", "0", "folder");
  const rows = [
    root,
    item("nested", "root", "folder"),
    item("last", "root"),
    item("ws", "nested", "websocket"),
    item("socket", "nested", "socketio"),
    item("outside", "0"),
  ];
  const snapshot = structuredClone(rows);
  assert.deepEqual(Array.from(getCollectionChildIds(rows, root)), [
    "root",
    "nested",
    "ws",
    "socket",
    "last",
  ]);
  assert.deepEqual(rows, snapshot);
});
test("test runs preserve API-first folder traversal and stable sibling sorting", () => {
  const rows = [
    item("laterFolder", "root", "folder", 4),
    item("firstFolder", "root", "folder", 1),
    item("a", "root", "api", 3),
    item("b", "root", "api", 2),
    item("sameSort", "root", "api", 2),
    item("nested", "firstFolder", "folder"),
    item("c", "firstFolder"),
    item("d", "nested"),
    item("e", "laterFolder"),
    item("ws", "root", "websocket"),
  ];
  const snapshot = structuredClone(rows);
  assert.deepEqual(ids(getCollectionApis(rows, "root")), [
    "b",
    "sameSort",
    "a",
    "c",
    "d",
    "e",
  ]);
  assert.deepEqual(rows, snapshot);
});
test("cycles terminate and do not duplicate descendant IDs or test requests", () => {
  const root = item("root", "nested", "folder");
  const rows = [
    root,
    item("nested", "root", "folder"),
    item("a", "root"),
    item("b", "nested"),
  ];
  assert.deepEqual(Array.from(getCollectionChildIds(rows, root)), [
    "root",
    "nested",
    "b",
    "a",
  ]);
  assert.deepEqual(ids(getCollectionApis(rows, "root")), ["a", "b"]);
});
test("very deep collections do not use the JavaScript call stack", () => {
  const rows = Array.from({ length: 20000 }, (_, index) =>
    item(String(index), String(index - 1), "folder"),
  );
  rows.push(item("request", "19999"));
  assert.equal(getCollectionChildIds(rows, rows[0]).length, 20001);
  assert.deepEqual(ids(getCollectionApis(rows, "0")), ["request"]);
});
test("missing roots and disconnected rows keep their existing behavior", () => {
  const root = item("missing", "0", "folder");
  const rows = [item("orphan", "missing"), item("outside", "other")];
  assert.deepEqual(Array.from(getCollectionChildIds(rows, root)), [
    "missing",
    "orphan",
  ]);
  assert.deepEqual(ids(getCollectionApis(rows, "missing")), ["orphan"]);
  assert.deepEqual(ids(getCollectionApis(rows, "empty")), []);
});
