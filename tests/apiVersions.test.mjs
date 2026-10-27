import { test } from "node:test";
import assert from "node:assert/strict";
import load from "./helpers/loadTypeScript.mjs";
import { nativeDependency } from "./helpers/loadTypeScript.mjs";
const { findApiConflicts, applyApiVersions } = await load(
  "packages/domain/src/sync/utils/api-versions.ts",
  (id) => nativeDependency(id),
);
const api = (id, version = 1, type = "api") => ({
  id: id,
  kind: type,
  version,
  parentId: "parent",
});
const ids = (rows) => Array.from(rows, (row) => row.id);
test("conflicts prefer numeric recorded versions, including zero, over request versions", () => {
  const local = [
    api("recorded", 20),
    api("zero", 20),
    api("fallback", 2),
    api("equal", 2),
    api("older", 3),
    api("missing"),
  ];
  const snapshot = structuredClone(local);
  const cloud = [
    api("recorded", 3),
    api("zero", 1),
    api("fallback", 3),
    api("equal", 2),
    api("older", 2),
  ];
  const result = findApiConflicts(local, cloud, {
    recorded: 2,
    zero: 0,
    fallback: "10",
  });
  assert.deepEqual(ids(result), ["recorded", "zero", "fallback"]);
  assert.ok(result.every((row) => row.parentId === "0"));
  assert.deepEqual(local, snapshot);
});
test("conflict types and stable folder-first ordering retain existing behavior", () => {
  const types = [
    "api",
    "sse",
    "websocket",
    "socketio",
    "graphql",
    "folder",
    "folder",
    "doc",
    "grpc",
    "socket",
    "socket_method",
    "unknown-protocol",
  ];
  const local = types.map((type, index) => api(String(index), 1, type));
  const cloud = local.map((row) => ({ ...row, version: 2 }));
  assert.deepEqual(ids(findApiConflicts(local, cloud, {})), [
    "5",
    "6",
    "0",
    "1",
    "2",
    "3",
    "4",
  ]);
});
test("duplicate cloud IDs still conflict when any version exceeds the baseline", () => {
  assert.deepEqual(
    ids(
      findApiConflicts(
        [api("request")],
        [api("request", 5), api("request", 0)],
        {},
      ),
    ),
    ["request"],
  );
  assert.deepEqual(
    ids(
      findApiConflicts(
        [api("request")],
        [api("request", NaN), api("request", 5)],
        {},
      ),
    ),
    ["request"],
  );
});
test("version application ignores unknown IDs and non-numeric versions while preserving local content", () => {
  const local = [{ ...api("request"), name: "Unsaved content" }, api("other")];
  const response = [
    { id: "unknown", version: 10 },
    { id: "request", version: 2 },
    { id: "request", version: "3" },
  ];
  assert.equal(applyApiVersions(local, response), true);
  assert.equal(local[0].version, 2);
  assert.equal(local[0].name, "Unsaved content");
  assert.equal(local[1].version, 1);
  assert.equal(applyApiVersions(local, [{ id: "unknown", version: 3 }]), false);
});
test("version application retains zero, last valid response and first local match rules", () => {
  const local = [api("request", 5), api("request", 6)];
  assert.equal(applyApiVersions(local, [{ id: "request", version: 0 }]), true);
  assert.equal(local[0].version, 0);
  assert.equal(local[1].version, 6);
  assert.equal(
    applyApiVersions(local, [
      { id: "request", version: 2 },
      { id: "request", version: 3 },
    ]),
    true,
  );
  assert.equal(local[0].version, 3);
});

test("native records without optional version metadata use the initial conflict baseline", () => {
  const row = { id: "native", parentId: "0", kind: "api" };
  assert.deepEqual(
    JSON.parse(
      JSON.stringify(
        findApiConflicts([row], [{ id: "native", version: 1 }], {}),
      ),
    ),
    [row],
  );
  assert.equal(
    findApiConflicts([row], [{ id: "native", version: 0 }], {}).length,
    0,
  );
});
